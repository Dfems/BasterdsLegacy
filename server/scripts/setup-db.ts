#!/usr/bin/env tsx
import dotenv from 'dotenv'

// Carica le variabili d'ambiente
dotenv.config()

async function setupDatabase(): Promise<void> {
  console.log('🔧 Setup automatico database...\n')

  try {
    // Passo 1: Genera client Prisma
    console.log('📦 Generazione client Prisma...')
    const { spawn } = await import('child_process')

    try {
      await new Promise<void>((resolve, reject) => {
        const generate = spawn('npx', ['prisma', 'generate'], {
          stdio: 'inherit',
          cwd: process.cwd(),
        })

        generate.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Client Prisma generato')
            resolve()
          } else {
            reject(new Error(`Generazione client fallita con codice ${code}`))
          }
        })

        generate.on('error', (error) => {
          reject(error)
        })
      })
    } catch (error) {
      console.log('⚠️  Impossibile generare client Prisma (probabilmente network issue)')
      console.log('   Il server userà il database mock per lo sviluppo')
      return
    }

    // Passo 2: Tenta di importare e usare Prisma
    try {
      const { PrismaClient } = await import('@prisma/client')
      const db = new PrismaClient()

      // Test connessione
      await db.$connect()
      console.log('✅ Connessione database stabilita')

      // Verifica se il database è stato migrato
      try {
        await db.user.findFirst()
        console.log('✅ Schema database già presente')
      } catch (error) {
        console.log('⚠️  Schema database non trovato, eseguendo push...')

        // Esegui db push
        await new Promise<void>((resolve, reject) => {
          const push = spawn('npx', ['prisma', 'db', 'push'], {
            stdio: 'inherit',
            cwd: process.cwd(),
          })

          push.on('close', (code) => {
            if (code === 0) {
              console.log('✅ Schema database applicato')
              resolve()
            } else {
              reject(new Error(`Push database fallito con codice ${code}`))
            }
          })

          push.on('error', reject)
        })
      }

      // Controlla se esistono owner
      const ownerCount = await db.user.count({
        where: { role: 'owner' },
      })

      if (ownerCount === 0) {
        console.log('\n⚠️  Nessun owner trovato nel sistema!')
        console.log('   Per completare il setup, crea un owner con:')
        console.log('   npm run create:owner')
        console.log('\n   Oppure usa le credenziali di test per sviluppo:')
        console.log('   Email: admin@test.com')
        console.log('   Password: password')
      } else {
        console.log(`\n✅ Trovati ${ownerCount} owner nel sistema`)
      }

      await db.$disconnect()
      console.log('\n🎉 Setup database completato! Prisma attivo.')
    } catch (error) {
      console.log('⚠️  Errore con Prisma, il server userà il database mock')
      console.log('   Questo è normale in ambiente di sviluppo senza connessione')
    }
  } catch (error) {
    console.log('\n⚠️  Setup Prisma non riuscito, utilizzando database mock')
    console.log('   Il server funzionerà comunque in modalità sviluppo')
    console.log('\n💡 Per attivare Prisma in futuro:')
    console.log('   1. Verifica connessione internet')
    console.log('   2. Esegui: npm run db:generate')
    console.log('   3. Esegui: npm run db:push')
    console.log('   4. Riavvia con: npm run dev')
  }
}

setupDatabase()
