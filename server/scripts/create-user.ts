#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { stdin, stdout } from 'process'
import { createInterface } from 'readline'

const db = new PrismaClient()

const rl = createInterface({
  input: stdin,
  output: stdout,
})

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

const questionPassword = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    process.stdout.write(prompt)
    process.stdin.setRawMode(true)
    process.stdin.resume()

    let password = ''

    process.stdin.on('data', (char) => {
      const c = char.toString()

      if (c === '\r' || c === '\n') {
        process.stdout.write('\n')
        process.stdin.setRawMode(false)
        process.stdin.pause()
        resolve(password)
      } else if (c === '\u0003') {
        // Ctrl+C
        process.exit(0)
      } else if (c === '\u007f') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1)
          process.stdout.write('\b \b')
        }
      } else {
        password += c
        process.stdout.write('*')
      }
    })
  })
}

async function createUser(): Promise<void> {
  try {
    console.log('👤 Creazione nuovo User\n')

    // Input dati
    const email = await question('📧 Email: ')
    if (!email || !email.includes('@')) {
      console.error('❌ Email non valida')
      process.exit(1)
    }

    // Controlla se l'email esiste già
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.error('❌ Un utente con questa email esiste già')
      process.exit(1)
    }

    // Selezione ruolo
    console.log('\n🎭 Ruoli disponibili:')
    console.log('1. user - Può gestire server e file')
    console.log('2. viewer - Solo visualizzazione')

    const roleChoice = await question('\nSeleziona ruolo (1-2): ')
    let role: 'user' | 'viewer'

    switch (roleChoice.trim()) {
      case '1':
        role = 'user'
        break
      case '2':
        role = 'viewer'
        break
      default:
        console.error('❌ Scelta non valida')
        process.exit(1)
    }

    const password = await questionPassword('🔑 Password: ')
    if (!password || password.length < 6) {
      console.error('\n❌ La password deve essere di almeno 6 caratteri')
      process.exit(1)
    }

    const confirmPassword = await questionPassword('🔑 Conferma password: ')
    if (password !== confirmPassword) {
      console.error('\n❌ Le password non corrispondono')
      process.exit(1)
    }

    // Hash password
    const passHash = await bcrypt.hash(password, 10)

    // Crea user
    const user = await db.user.create({
      data: {
        email,
        passHash,
        role,
      },
    })

    console.log(`\n✅ Utente creato con successo!`)
    console.log(`📧 Email: ${user.email}`)
    console.log(`🎭 Ruolo: ${user.role}`)
    console.log(`🆔 ID: ${user.id}`)
    console.log(`📅 Creato: ${user.createdAt.toLocaleString()}`)
  } catch (error) {
    console.error("❌ Errore durante la creazione dell'utente:", error)
    process.exit(1)
  } finally {
    await db.$disconnect()
    rl.close()
  }
}

createUser()
