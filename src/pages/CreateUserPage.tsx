import type { FormEvent, JSX } from 'react'
import { useState } from 'react'

import { Box, Button, Heading, Input, Text } from '@chakra-ui/react'

import { SimpleSelect } from '@/shared/components/SimpleSelect'

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
    <Box display="flex" flexDirection="column" gap={4}>
      <Box>
        <Heading size="sm" mb={2}>
          Mostra form creazione (flag yes)
        </Heading>
        <SimpleSelect
          value={show ? 'yes' : 'no'}
          onChange={(v) => setShow(v === 'yes')}
          options={[
            { value: 'no', label: 'no' },
            { value: 'yes', label: 'yes' },
          ]}
        />
      </Box>

      {show && (
        <Box as="form" onSubmit={onSubmit} maxW={480} display="grid" gap={3}>
          <Box>
            <Text>Email</Text>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              mt={1}
            />
          </Box>
          <Box>
            <Text>Password</Text>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              mt={1}
            />
          </Box>
          <Box>
            <Text as="label">Ruolo</Text>
            <SimpleSelect
              value={role}
              onChange={(v) => setRole(v as 'user' | 'viewer')}
              options={[
                { value: 'user', label: 'user' },
                { value: 'viewer', label: 'viewer' },
              ]}
            />
          </Box>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creazione…' : 'Crea utente'}
          </Button>
          {msg && <Text color="green.400">{msg}</Text>}
          {err && <Text color="red.400">{err}</Text>}
        </Box>
      )}
    </Box>
  )
}

export default CreateUserPage
