import multipart from '@fastify/multipart'
import type { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { list, rename as mv, remove, saveStream, unzipFile, zipPaths } from '../filemgr/fs.js'
import { auditLog } from '../lib/audit.js'

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
      const body = (await req.body) as { path?: string }
      if (!body?.path) return reply.status(400).send({ error: 'Invalid body' })
      await remove(body.path)
      await auditLog({ type: 'file', op: 'delete', path: body.path, userId: req.user?.sub })
      return { ok: true }
    }
  )

  fastify.post(
    '/api/files/upload',
    {
      preHandler: fastify.authorize('user'),
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const mp = await req.file()
      if (!mp) return reply.status(400).send({ error: 'No file' })
      const dest = (req.query as { to?: string })?.to ?? `/${mp.filename}`
      await saveStream(dest, mp.file)
      await auditLog({ type: 'file', op: 'upload', path: dest, userId: req.user?.sub })
      return { ok: true }
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

  done()
}

export { plugin as filesRoutes }
