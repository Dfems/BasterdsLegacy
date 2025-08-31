import type { ChangeEvent, JSX } from 'react'

import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react'
import { Link, NavLink } from 'react-router-dom'

import useLanguage from '@/hooks/useLanguage'

interface NavbarProps {
  isLoggedIn: boolean
  onLogout: () => void
}

const NavItem = ({ to, children }: { to: string; children: JSX.Element | string }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? '#67e8f9' : '#fff' })}
  >
    {children}
  </NavLink>
)

export default function Navbar({ isLoggedIn, onLogout }: NavbarProps): JSX.Element {
  const { t, language, setLanguage } = useLanguage()

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="docked"
      bg="gray.800"
      color="white"
      borderBottomWidth="1px"
      borderColor="gray.700"
    >
      <Flex
        as="nav"
        aria-label="Main navigation"
        align="center"
        justify="space-between"
        px={4}
        py={3}
        w="100%"
      >
        <HStack gap={3} align="center">
          <Link to="/" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 700 }}>
            {t.appName}
          </Link>
          <NavItem to="/">Home</NavItem>
          {isLoggedIn && <NavItem to="/app/console">Console</NavItem>}
        </HStack>

        <HStack gap={3} align="center">
          <HStack gap={2} align="center">
            <Text as="span" fontSize="sm" color="gray.300">
              Lang
            </Text>
            <select
              value={language}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
              style={{
                background: '#2d3748',
                color: '#fff',
                borderColor: '#4a5568',
                borderRadius: 6,
                padding: '2px 6px',
              }}
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </HStack>

          {isLoggedIn ? (
            <Button size="sm" variant="outline" colorScheme="cyan" onClick={onLogout} type="button">
              Disconnect
            </Button>
          ) : (
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>
              {t.loginTitle}
            </Link>
          )}
        </HStack>
      </Flex>
    </Box>
  )
}
