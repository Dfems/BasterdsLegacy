import bcrypt from 'bcrypt'
import readline from 'readline/promises'

async function generaEStampaHash() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const password = await rl.question('Inserisci la password che vuoi trasformare in hash: ')
    const saltRounds = 10 // Puoi regolare il numero di "salt rounds"
    const hash = await bcrypt.hash(password, saltRounds)
    console.log("L'hash generato è:", hash)
  } catch (err) {
    console.error('Si è verificato un errore:', err)
  } finally {
    rl.close()
  }
}

generaEStampaHash()
