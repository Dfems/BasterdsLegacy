import archiver from 'archiver'
import extract from 'extract-zip'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import { CONFIG } from '../lib/config.js'

type Entry = {
  name: string
  type: 'file' | 'dir'
  size: number
  mtime: number
}

const base = path.resolve(CONFIG.MC_DIR)

export const resolveSafe = (p: string): string => {
  // Normalize slashes and strip dangerous '..' sequences
  const cleaned = String(p).replaceAll('..', '')
  const target = path.resolve(base, '.' + path.sep + cleaned)
  const rel = path.relative(base, target)
  // If rel starts with '..' or is absolute, target is outside the sandbox
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Path outside sandbox')
  return target
}

export const list = async (p: string): Promise<Entry[]> => {
  const abs = resolveSafe(p)
  const dirents = await fsp.readdir(abs, { withFileTypes: true })
  const entries: Entry[] = []
  for (const d of dirents) {
    const full = path.join(abs, d.name)
    const stat = await fsp.stat(full)
    entries.push({
      name: d.name,
      type: d.isDirectory() ? 'dir' : 'file',
      size: d.isDirectory() ? 0 : stat.size,
      mtime: stat.mtimeMs,
    })
  }
  return entries
}

export const remove = async (p: string): Promise<void> => {
  const abs = resolveSafe(p)
  await fsp.rm(abs, { recursive: true, force: true })
}

export const rename = async (from: string, to: string): Promise<void> => {
  const a = resolveSafe(from)
  const b = resolveSafe(to)
  await fsp.mkdir(path.dirname(b), { recursive: true })
  await fsp.rename(a, b)
}

export const zipPaths = async (paths: string[], out: string): Promise<string> => {
  const absOut = resolveSafe(out)
  await fsp.mkdir(path.dirname(absOut), { recursive: true })
  const output = fs.createWriteStream(absOut)
  const archive = archiver('zip', { zlib: { level: 9 } })
  const done = new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve())
    archive.on('error', (err) => reject(err))
  })
  archive.pipe(output)
  for (const p of paths) {
    const abs = resolveSafe(p)
    const stat = await fsp.stat(abs)
    const name = path.basename(abs)
    if (stat.isDirectory()) archive.directory(abs, name)
    else archive.file(abs, { name })
  }
  await archive.finalize()
  await done
  return absOut
}

export const unzipFile = async (file: string, to: string): Promise<string> => {
  const absZip = resolveSafe(file)
  const absTo = resolveSafe(to)
  await fsp.mkdir(absTo, { recursive: true })
  await extract(absZip, { dir: absTo })
  return absTo
}

export const saveStream = async (
  destRel: string,
  stream: NodeJS.ReadableStream
): Promise<string> => {
  const dest = resolveSafe(destRel)
  await fsp.mkdir(path.dirname(dest), { recursive: true })
  const out = fs.createWriteStream(dest)
  await pipeline(stream, out)
  return dest
}

export const readTextFile = async (p: string): Promise<string> => {
  const abs = resolveSafe(p)
  const stat = await fsp.stat(abs)
  if (!stat.isFile()) throw new Error('Path is not a file')
  return await fsp.readFile(abs, 'utf-8')
}

export const writeTextFile = async (p: string, content: string): Promise<void> => {
  const abs = resolveSafe(p)
  await fsp.mkdir(path.dirname(abs), { recursive: true })
  await fsp.writeFile(abs, content, 'utf-8')
}
