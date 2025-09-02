import type { FormEvent, JSX } from 'react'
import { useContext, useState } from 'react'

import { Box, Button, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

import { GlassCard } from '@/shared/components/GlassCard'

import AuthContext from '../contexts/AuthContext'
import useLanguage from '../hooks/useLanguage'

// removed legacy CSS; page inherits global styles

export default function Login(): JSX.Element {
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Box p={6} display="flex" justifyContent="center">
      <GlassCard as="form" onSubmit={handleSubmit} maxW={440} w="100%">
        <Heading size="lg" mb={4} textAlign="center">
          {t.loginTitle}
        </Heading>
        <Stack gap={3}>
          <Box>
            <label htmlFor="username" style={{ display: 'block', marginBottom: 4 }}>
              Utente
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-variant="glass"
            />
          </Box>
          <Box>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-variant="glass"
            />
          </Box>
          <GlassCard inset>
            <Button type="submit" width="100%" data-variant="glass">
              Login
            </Button>
          </GlassCard>
          {error && (
            <Text color="red.400" textAlign="center">
              {error}
            </Text>
          )}
        </Stack>
      </GlassCard>
    </Box>
  )
}
