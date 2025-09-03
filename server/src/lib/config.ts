import path from 'node:path'

const env = (key: string, fallback: string): string => (process.env[key] ?? fallback).toString()

export const CONFIG = {
  PORT: Number(env('PORT', '3000')),
  JWT_SECRET: env('JWT_SECRET', 'change_me'),
  JWT_EXPIRES: env('JWT_EXPIRES', '1h'),
  MC_DIR: path.resolve(env('MC_DIR', './server/runtime')),
  BACKUP_DIR: path.resolve(env('BACKUP_DIR', './server/runtime/backups')),
  JAVA_BIN: env('JAVA_BIN', 'java'),
  RCON_ENABLED: env('RCON_ENABLED', 'false') === 'true',
  RCON_HOST: env('RCON_HOST', '127.0.0.1'),
  RCON_PORT: Number(env('RCON_PORT', '25575')),
  RCON_PASS: env('RCON_PASS', ''),
  BACKUP_CRON: env('BACKUP_CRON', '0 3 * * *'),
  RETENTION_DAYS: Number(env('RETENTION_DAYS', '7')),
  RETENTION_WEEKS: Number(env('RETENTION_WEEKS', '4')),
} as const

export type AppConfig = typeof CONFIG
