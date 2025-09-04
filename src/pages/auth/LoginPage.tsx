import type { FormEvent, JSX } from 'react'
import { useContext, useState } from 'react'

import { Box, Button, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

import AuthContext from '@/entities/user/AuthContext'
import { GlassCard } from '@/shared/components/GlassCard'
import useLanguage from '@/shared/hooks/useLanguage'

// removed legacy CSS; page inherits global styles

export default function Login(): JSX.Element {
  const { common, auth } = useLanguage()
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
    <Box p={{ base: 4, md: 6 }} display="flex" justifyContent="center">
      {' '}
      {/* Padding responsive */}
      <GlassCard as="form" onSubmit={handleSubmit} maxW={440} w="100%" p={{ base: 4, md: 6 }}>
        {' '}
        {/* Padding responsive */}
        <Heading size={{ base: 'md', md: 'lg' }} mb={4} textAlign="center">
          {' '}
          {/* Font size responsive */}
          {auth.loginTitle}
        </Heading>
        <Stack gap={4}>
          {' '}
          {/* Aumentato gap per mobile */}
          <Box>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                marginBottom: 8, // Aumentato per mobile
                fontSize: '14px', // Font size specifico per label
              }}
            >
              {common.username}
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-variant="glass"
              minH="44px" // Touch target minimo per mobile
              fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
            />
          </Box>
          <Box>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: 8, // Aumentato per mobile
                fontSize: '14px', // Font size specifico per label
              }}
            >
              {common.password}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-variant="glass"
              minH="44px" // Touch target minimo per mobile
              fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
            />
          </Box>
          <GlassCard inset>
            <Button
              type="submit"
              width="100%"
              data-variant="glass"
              bg="surface"
              borderColor="borderAccent"
              color="text"
              minH="48px" // Touch target più grande per il pulsante principale
              fontSize={{ base: 'sm', md: 'md' }} // Font size responsive
              _hover={{
                bg: 'surfaceSolid',
                borderColor: 'brand.primary',
                transform: 'translateY(-1px)',
              }}
            >
              {auth.loginButton}
            </Button>
          </GlassCard>
          {error && (
            <Text color="accent.danger" textAlign="center" fontSize={{ base: 'sm', md: 'md' }}>
              {error}
            </Text>
          )}
        </Stack>
      </GlassCard>
    </Box>
  )
}
