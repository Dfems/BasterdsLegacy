import type { ChangeEvent, FormEvent, JSX } from 'react'
import { useState } from 'react'

const CreateUserPage = (): JSX.Element => {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'viewer'>('user')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })
      const data = (await res.json()) as { id?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Creazione fallita')
      setMsg('Utente creato')
      setEmail('')
      setPassword('')
      setRole('user')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label htmlFor="flag-yes" style={{ marginRight: 8 }}>
          Mostra form creazione (flag yes):
        </label>
        <select
          id="flag-yes"
          value={show ? 'yes' : 'no'}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setShow(e.target.value === 'yes')}
          style={{ padding: '4px 8px' }}
        >
          <option value="no">no</option>
          <option value="yes">yes</option>
        </select>
      </div>

      {show && (
        <form onSubmit={onSubmit} style={{ maxWidth: 480 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '6px 8px', marginTop: 4 }}
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '6px 8px', marginTop: 4 }}
              />
            </div>

            <div>
              <label htmlFor="role">Ruolo</label>
              <select
                id="role"
                value={role}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setRole(e.target.value as 'user' | 'viewer')
                }
                style={{ width: '100%', padding: '6px 8px', marginTop: 4 }}
              >
                <option value="user">user</option>
                <option value="viewer">viewer</option>
              </select>
            </div>

            <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
              {loading ? 'Creazione…' : 'Crea utente'}
            </button>

            {msg && <div style={{ color: '#48bb78' }}>{msg}</div>}
            {err && <div style={{ color: '#f56565' }}>{err}</div>}
          </div>
        </form>
      )}
    </div>
  )
}

export default CreateUserPage
