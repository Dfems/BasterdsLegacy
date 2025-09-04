import type { FormEvent, JSX } from 'react'
import { useState } from 'react'

import { Box, Button, Heading, Input, Text } from '@chakra-ui/react'

import { SimpleSelect } from '@/shared/components/SimpleSelect'
import useLanguage from '@/shared/hooks/useLanguage'

const CreateUserPage = (): JSX.Element => {
  const { users } = useLanguage()
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
      setMsg(users.created)
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
    <Box display="flex" flexDirection="column" gap={4} p={{ base: 4, md: 6 }}>
      {' '}
      {/* Padding responsive */}
      <Box>
        <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
          {' '}
          {/* Font size responsive */}
          {users.showForm}
        </Heading>
        <SimpleSelect
          value={show ? users.yes : users.no}
          onChange={(v) => setShow(v === users.yes)}
          options={[
            { value: users.no, label: users.no },
            { value: users.yes, label: users.yes },
          ]}
        />
      </Box>
      {show && (
        <Box
          as="form"
          onSubmit={onSubmit}
          maxW={480}
          display="grid"
          gap={{ base: 3, md: 4 }} // Gap responsive
          p={{ base: 3, md: 4 }} // Padding responsive
        >
          <Box>
            <Text fontSize={{ base: 'sm', md: 'md' }}>{users.email}</Text>{' '}
            {/* Font size responsive */}
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              mt={1}
              data-variant="glass"
              minH="44px" // Touch target
              fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
            />
          </Box>
          <Box>
            <Text fontSize={{ base: 'sm', md: 'md' }}>{users.password}</Text>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              mt={1}
              data-variant="glass"
              minH="44px" // Touch target
              fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
            />
          </Box>
          <Box>
            <Text as="label" fontSize={{ base: 'sm', md: 'md' }}>
              {users.role}
            </Text>
            <SimpleSelect
              value={role}
              onChange={(v) => setRole(v as 'user' | 'viewer')}
              options={[
                { value: 'user', label: users.roleUser },
                { value: 'viewer', label: users.roleViewer },
              ]}
            />
          </Box>
          <Button
            type="submit"
            disabled={loading}
            data-variant="glass"
            minH="48px" // Touch target più grande per il pulsante principale
            fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
          >
            {loading ? users.creating : users.create}
          </Button>
          {msg && (
            <Text color="accent.success" fontSize={{ base: 'sm', md: 'md' }}>
              {msg}
            </Text>
          )}
          {err && (
            <Text color="accent.danger" fontSize={{ base: 'sm', md: 'md' }}>
              {err}
            </Text>
          )}
        </Box>
      )}
    </Box>
  )
}

export default CreateUserPage
