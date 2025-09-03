import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LanguageProvider from '@/entities/language/LanguageProvider'
import AuthProvider from '@/entities/user/AuthProvider'
import Login from '@/pages/auth/LoginPage'

// Minimal translations provider stub through LanguageProvider

const system = createSystem(defaultConfig)

const setup = () =>
  render(
    <ChakraProvider value={system}>
      <MemoryRouter>
        <AuthProvider>
          <LanguageProvider>
            <Login />
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    </ChakraProvider>
  )

describe('Login flow', () => {
  const fetchSpy = vi.spyOn(window, 'fetch')

  beforeEach(() => {
    fetchSpy.mockReset()
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('logs in successfully', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      // valid-looking JWT with far-future exp: header={alg:HS256}, payload={exp: 4102444800}
      json: async () => ({ token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.sig' }),
      headers: new Headers(),
    } as unknown as Response)

    setup()

    fireEvent.change(screen.getByLabelText(/Utente/i), { target: { value: 'owner@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /Login/i }))

    await waitFor(() => {
      // token saved in localStorage by AuthProvider
      expect(localStorage.getItem('token')).toBe(
        'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.sig'
      )
    })
  })

  it('shows error on invalid credentials', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
      headers: new Headers(),
    } as unknown as Response)

    setup()

    fireEvent.change(screen.getByLabelText(/Utente/i), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'y' } })
    const btn = screen.getAllByRole('button', { name: /Login/i })[0]!
    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument()
    })
  })
})
