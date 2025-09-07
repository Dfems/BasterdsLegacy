#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
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

async function removeOwner(): Promise<void> {
  try {
    console.log('🗑️  Rimozione Owner\n')

    // Lista tutti gli owner
    const owners = await db.user.findMany({
      where: { role: 'owner' },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    })

    if (owners.length === 0) {
      console.log('ℹ️  Nessun owner trovato nel database.')
      process.exit(0)
    }

    if (owners.length === 1) {
      console.log("⚠️  ATTENZIONE: Stai per rimuovere l'unico owner del sistema!")
      console.log('   Dopo questa operazione non potrai più accedere come amministratore.')
      console.log('   Assicurati di aver creato un nuovo owner prima di procedere.\n')
    }

    console.log('Owner esistenti:')
    owners.forEach((owner, index) => {
      console.log(
        `${index + 1}. ${owner.email} (ID: ${owner.id}) - Creato: ${owner.createdAt.toLocaleString()}`
      )
    })

    const choice = await question(
      `\nSeleziona owner da rimuovere (1-${owners.length}) o 'q' per annullare: `
    )

    if (choice.toLowerCase() === 'q') {
      console.log('Operazione annullata.')
      process.exit(0)
    }

    const selectedIndex = parseInt(choice) - 1
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= owners.length) {
      console.error('❌ Scelta non valida')
      process.exit(1)
    }

    const selectedOwner = owners[selectedIndex]

    // Conferma finale
    const confirm = await question(
      `\n⚠️  Confermi la rimozione di "${selectedOwner.email}"? (ATTENZIONE: questa azione è irreversibile) (yes/NO): `
    )
    if (confirm !== 'yes') {
      console.log('Operazione annullata.')
      process.exit(0)
    }

    // Rimuovi owner
    await db.user.delete({
      where: { id: selectedOwner.id },
    })

    console.log(`\n✅ Owner "${selectedOwner.email}" rimosso con successo!`)

    // Controlla se ci sono ancora owner
    const remainingOwners = await db.user.count({
      where: { role: 'owner' },
    })

    if (remainingOwners === 0) {
      console.log('\n⚠️  ATTENZIONE: Non ci sono più owner nel sistema!')
      console.log('   Ricordati di creare un nuovo owner con: npm run create:owner')
    } else {
      console.log(`\nℹ️  Rimangono ${remainingOwners} owner nel sistema.`)
    }
  } catch (error) {
    console.error("❌ Errore durante la rimozione dell'owner:", error)
    process.exit(1)
  } finally {
    await db.$disconnect()
    rl.close()
  }
}

removeOwner()
