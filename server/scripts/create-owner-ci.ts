#!/usr/bin/env tsx
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

// Carica le variabili d'ambiente da .env (necessario per DATABASE_URL di Prisma)
dotenv.config()

const requireEnv = (name: 'OWNER_EMAIL' | 'OWNER_PASSWORD'): string => {
  const v = process.env[name]
  if (!v) {
    console.error('OWNER_EMAIL/OWNER_PASSWORD env vars are required')
    process.exit(1)
  }
  return v
}

const email = requireEnv('OWNER_EMAIL').trim().toLowerCase()
const password = requireEnv('OWNER_PASSWORD')

// email/password già validate da requireEnv

const db = new PrismaClient()

async function main() {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.role !== Role.owner) {
      await db.user.update({ where: { id: existing.id }, data: { role: Role.owner } })
      console.log(`Updated existing user ${email} to role=owner`)
    } else {
      console.log(`Owner ${email} already exists; nothing to do`)
    }
    return
  }

  const passHash = await bcrypt.hash(password, 10)
  const user = await db.user.create({ data: { email, passHash, role: Role.owner } })
  console.log(`Created owner: ${user.email} (${user.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
