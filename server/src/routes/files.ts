import multipart from '@fastify/multipart'
import type { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'

import {
  list,
  rename as mv,
  remove,
  saveStream,
  unzipFile,
  zipPaths,
  resolveSafe,
  readTextFile,
  writeTextFile,
} from '../filemgr/fs.js'
import { auditLog } from '../lib/audit.js'
import { getConfig } from '../lib/config.js'

const plugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  fastify.register(multipart)

  fastify.get(
    '/api/files',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (req) => {
      const { path: p = '/' } = req.query as { path?: string }
      return { entries: await list(p) }
    }
  )

  fastify.post(
    '/api/files/rename',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = (await req.body) as { from?: string; to?: string }
      if (!body?.from || !body?.to) return reply.status(400).send({ error: 'Invalid body' })
      await mv(body.from, body.to)
      await auditLog({
        type: 'file',
        op: 'rename',
        path: `${body.from} -> ${body.to}`,
        userId: req.user?.sub,
      })
      return { ok: true }
    }
  )

  fastify.delete(
    '/api/files',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = (await req.body) as { path?: string; paths?: string[] }

      // Support both single path and multiple paths
      if (body?.paths && Array.isArray(body.paths) && body.paths.length > 0) {
        // Bulk delete
        for (const p of body.paths) {
          await remove(p)
        }
        await auditLog({
          type: 'file',
          op: 'delete',
          path: `bulk: ${body.paths.join(', ')}`,
          userId: req.user?.sub,
        })
        return { ok: true, deleted: body.paths.length }
      } else if (body?.path) {
        // Single delete
        await remove(body.path)
        await auditLog({ type: 'file', op: 'delete', path: body.path, userId: req.user?.sub })
        return { ok: true }
      }

      return reply.status(400).send({ error: 'Invalid body' })
    }
  )

  fastify.post(
    '/api/files/upload',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const files = await req.files()
      const uploadedPaths: string[] = []

      for await (const mp of files) {
        const dest = (req.query as { to?: string })?.to ?? `/${mp.filename}`
        await saveStream(dest, mp.file)
        uploadedPaths.push(dest)
        await auditLog({ type: 'file', op: 'upload', path: dest, userId: req.user?.sub })
      }

      if (uploadedPaths.length === 0) {
        return reply.status(400).send({ error: 'No files' })
      }

      return { ok: true, uploaded: uploadedPaths.length }
    }
  )

  fastify.post(
    '/api/files/zip',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = (await req.body) as { paths?: string[]; out?: string }
      if (!body?.paths?.length || !body?.out)
        return reply.status(400).send({ error: 'Invalid body' })
      const out = await zipPaths(body.paths, body.out)
      await auditLog({ type: 'file', op: 'zip', path: out, userId: req.user?.sub })
      return { out }
    }
  )

  fastify.post(
    '/api/files/unzip',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const body = (await req.body) as { file?: string; to?: string }
      if (!body?.file || !body?.to) return reply.status(400).send({ error: 'Invalid body' })
      const dir = await unzipFile(body.file, body.to)
      await auditLog({
        type: 'file',
        op: 'unzip',
        path: `${body.file} -> ${body.to}`,
        userId: req.user?.sub,
      })
      return { dir }
    }
  )

  // Read file content endpoint
  fastify.get(
    '/api/files/content',
    {
      preHandler: fastify.authorize('viewer'),
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      try {
        const { path: p } = req.query as { path?: string }
        if (!p) return reply.status(400).send({ error: 'Missing path' })

        const content = await readTextFile(p)
        await auditLog({ type: 'file', op: 'read', path: p, userId: req.user?.sub })
        return { content }
      } catch (err) {
        req.log.error({ err }, 'read content error')
        return reply.status(500).send({ error: 'Failed to read file content' })
      }
    }
  )

  // Write file content endpoint
  fastify.put(
    '/api/files/content',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      try {
        const body = (await req.body) as { path?: string; content?: string }
        if (!body?.path || body?.content === undefined) {
          return reply.status(400).send({ error: 'Missing path or content' })
        }

        await writeTextFile(body.path, body.content)
        await auditLog({
          type: 'file',
          op: 'edit',
          path: body.path,
          userId: req.user?.sub,
        })
        return { ok: true }
      } catch (err) {
        req.log.error({ err }, 'write content error')
        return reply.status(500).send({ error: 'Failed to write file content' })
      }
    }
  )

  // Download file endpoint
  fastify.get(
    '/api/files/download',
    {
      // Public route with internal guard: only specific configured files are public
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      try {
        const { path: p } = req.query as { path?: string }
        if (!p) return reply.status(400).send({ error: 'Missing path' })

        // Build whitelist of publicly downloadable absolute paths (can be inside or outside sandbox)
        const cfg = await getConfig()
        const whitelistAbs: string[] = []
        {
          const base = path.resolve(cfg.MC_DIR)
          for (const val of [cfg.CONFIG_BTN_PATH, cfg.LAUNCHER_BTN_PATH]) {
            if (!val) continue
            if (path.isAbsolute(val)) {
              whitelistAbs.push(path.resolve(val))
            } else {
              // sanitize relative path and ensure it stays under base
              const cleaned = String(val).replaceAll('..', '')
              const candidate = path.resolve(base, '.' + path.sep + cleaned)
              const rel = path.relative(base, candidate)
              if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
                whitelistAbs.push(candidate)
              }
            }
          }
        }

        // Resolve requested path to an absolute candidate
        let abs = ''
        if (path.isAbsolute(p)) {
          abs = path.resolve(p)
        } else {
          try {
            abs = resolveSafe(p)
          } catch {
            return reply.status(400).send({ error: 'Invalid path' })
          }
        }

        const stat = await fs.promises.stat(abs).catch(() => null)
        if (!stat || !stat.isFile()) return reply.status(404).send({ error: 'Not found' })

        // Public allowed if the absolute path matches a whitelisted configured button path
        const isPublicAllowed = whitelistAbs.includes(abs)

        // If not public, require JWT and enforce sandbox for non-whitelisted paths
        if (!isPublicAllowed) {
          try {
            await req.jwtVerify()
          } catch {
            return reply.status(401).send({ error: 'Unauthorized' })
          }
          const base = path.resolve(cfg.MC_DIR)
          const rel = path.relative(base, abs)
          if (rel.startsWith('..') || path.isAbsolute(rel)) {
            return reply.status(403).send({ error: 'Path outside server directory' })
          }
        }

        const filename = path.basename(abs)
        const ext = path.extname(filename).toLowerCase()
        const mime =
          ext === '.zip'
            ? 'application/zip'
            : ext === '.jar'
              ? 'application/java-archive'
              : ext === '.json'
                ? 'application/json'
                : ext === '.txt' || ext === '.log'
                  ? 'text/plain; charset=utf-8'
                  : 'application/octet-stream'

        reply.header('Content-Type', mime)
        reply.header('Content-Disposition', `attachment; filename="${filename}"`)

        await auditLog({
          type: 'file',
          op: 'download',
          path: p,
          userId: req.user?.sub,
        })

        const stream = fs.createReadStream(abs)
        return reply.send(stream)
      } catch (err) {
        req.log.error({ err }, 'download error')
        return reply.status(500).send({ error: 'Download failed' })
      }
    }
  )

  done()
}

export { plugin as filesRoutes }
