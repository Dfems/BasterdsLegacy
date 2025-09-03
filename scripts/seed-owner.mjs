#!/usr/bin/env node
// Crea l'utente owner richiamando POST /api/auth/seed-owner
// Uso:
//   node scripts/seed-owner.mjs --email admin@example.com --password changeme [--base http://localhost:3000] [--token <JWT>]

const args = process.argv.slice(2)
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 ? args[idx + 1] : undefined
}

const email = getArg('email') || process.env.EMAIL
const password = getArg('password') || process.env.PASSWORD
const base = getArg('base') || process.env.BASE_URL || 'http://localhost:3000'
const token = getArg('token') || process.env.TOKEN

if (!email || !password) {
  console.error(
    'Usage: node scripts/seed-owner.mjs --email <email> --password <password> [--base <url>] [--token <JWT>]'
  )
  process.exit(1)
}

const url = `${base.replace(/\/$/, '')}/api/auth/seed-owner`

const headers = { 'Content-Type': 'application/json' }
if (token) headers.Authorization = `Bearer ${token}`
;(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error(`Error ${res.status}:`, data)
      process.exit(1)
    }
    console.log('Owner created or token issued:', {
      userId: data.userId,
      role: data.role,
    })
    if (data.token) {
      console.log('\nToken (JWT):\n', data.token)
      console.log('\nTip: store it client-side or use it as Bearer token for further requests.')
    }
  } catch (e) {
    console.error('Request failed:', e)
    process.exit(1)
  }
})()
