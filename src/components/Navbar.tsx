import type { JSX } from 'react'
import { useContext } from 'react'

import { Box, Drawer, Flex, HStack, IconButton, Link, Menu } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

import AuthContext from '@/contexts/AuthContext'
import useLanguage from '@/hooks/useLanguage'
import { GlassButton } from '@/shared/components/GlassButton'
import { SimpleSelect } from '@/shared/components/SimpleSelect'

interface NavbarProps {
  isLoggedIn: boolean
  onLogout: () => void
}

export default function Navbar({ isLoggedIn, onLogout }: NavbarProps): JSX.Element {
  useContext(AuthContext)
  const { language, setLanguage, t } = useLanguage()

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={100}
      bg="var(--chakra-colors-surface)"
      borderBottomWidth="1px"
      borderColor="var(--chakra-colors-border)"
      boxShadow="sm"
      color="var(--chakra-colors-text)"
    >
      <Flex
        as="nav"
        aria-label="Main navigation"
        align="center"
        justify="space-between"
        px={4}
        py={2.5}
        w="100%"
      >
        <Flex gap={2} align="center" wrap="wrap">
          <Link asChild fontWeight={800} _hover={{ textDecoration: 'none', color: '#bbf7d0' }}>
            <RouterLink to="/">{t.appName}</RouterLink>
          </Link>
          {/* <NavItem to="/">Home</NavItem> */}

          {/* Desktop: gruppi con sottomenu */}
          {isLoggedIn && (
            <HStack gap={2} align="center" display={{ base: 'none', md: 'flex' }}>
              <Menu.Root data-variant="glass">
                <Menu.Trigger asChild>
                  <GlassButton size="sm">Server ▾</GlassButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content boxShadow="lg" color="var(--chakra-colors-text)">
                    <Menu.Item value="console" asChild>
                      <RouterLink
                        to="/app/console"
                        style={{ padding: '8px 12px', borderRadius: 6, display: 'block' }}
                      >
                        Console
                      </RouterLink>
                    </Menu.Item>
                    <Menu.Item value="dashboard" asChild>
                      <RouterLink
                        to="/app/dashboard"
                        style={{ padding: '8px 12px', borderRadius: 6, display: 'block' }}
                      >
                        Dashboard
                      </RouterLink>
                    </Menu.Item>
                    <Menu.Item value="settings" asChild>
                      <RouterLink
                        to="/app/settings"
                        style={{ padding: '8px 12px', borderRadius: 6, display: 'block' }}
                      >
                        Settings
                      </RouterLink>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>

              <Menu.Root data-variant="glass">
                <Menu.Trigger asChild>
                  <GlassButton size="sm">Storage ▾</GlassButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content boxShadow="lg" color="var(--chakra-colors-text)">
                    <Menu.Item value="files" asChild>
                      <RouterLink
                        to="/app/files"
                        style={{ padding: '8px 12px', borderRadius: 6, display: 'block' }}
                      >
                        Files
                      </RouterLink>
                    </Menu.Item>
                    <Menu.Item value="backups" asChild>
                      <RouterLink
                        to="/app/backups"
                        style={{ padding: '8px 12px', borderRadius: 6, display: 'block' }}
                      >
                        Backups
                      </RouterLink>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>

              <Menu.Root data-variant="glass">
                <Menu.Trigger asChild>
                  <GlassButton size="sm">Gameplay ▾</GlassButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content boxShadow="lg" color="var(--chakra-colors-text)">
                    <Menu.Item value="whitelist" asChild>
                      <RouterLink
                        to="/app/whitelist"
                        style={{ padding: '8px 12px', borderRadius: 6, display: 'block' }}
                      >
                        Whitelist
                      </RouterLink>
                    </Menu.Item>
                    <Menu.Item value="modpack" asChild>
                      <RouterLink
                        to="/app/modpack"
                        style={{ padding: '8px 12px', borderRadius: 6, display: 'block' }}
                      >
                        Modpack
                      </RouterLink>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>

              {/* {role === 'owner' && <NavItem to="/app/users/new">New User</NavItem>} */}
            </HStack>
          )}

          {/* Mobile: hamburger → Drawer */}
          {isLoggedIn && (
            <Drawer.Root>
              <Drawer.Trigger asChild>
                <IconButton
                  aria-label="Apri menu"
                  size="sm"
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  display={{ base: 'inline-flex', md: 'none' }}
                >
                  <Box as="span" fontSize="lg" lineHeight="1">
                    ☰
                  </Box>
                </IconButton>
              </Drawer.Trigger>
              <Drawer.Backdrop />
              <Drawer.Positioner>
                <Drawer.Content
                  data-variant="glass"
                  bg="var(--chakra-colors-surfaceSolid)"
                  color="var(--chakra-colors-text)"
                >
                  <Drawer.Header color="green.300">Menu</Drawer.Header>
                  <Drawer.Body>
                    <Box mb={2} fontWeight="bold" color="green.300">
                      Server
                    </Box>
                    <Box mb={1}>
                      <Drawer.CloseTrigger asChild>
                        <Link asChild>
                          <RouterLink to="/app/console">Console</RouterLink>
                        </Link>
                      </Drawer.CloseTrigger>
                    </Box>
                    <Box mb={1}>
                      <Drawer.CloseTrigger asChild>
                        <Link asChild>
                          <RouterLink to="/app/dashboard">Dashboard</RouterLink>
                        </Link>
                      </Drawer.CloseTrigger>
                    </Box>
                    <Box mb={1}>
                      <Drawer.CloseTrigger asChild>
                        <Link asChild>
                          <RouterLink to="/app/settings">Settings</RouterLink>
                        </Link>
                      </Drawer.CloseTrigger>
                    </Box>

                    <Box mt={4} mb={2} fontWeight="bold" color="green.300">
                      Storage
                    </Box>
                    <Box mb={1}>
                      <Drawer.CloseTrigger asChild>
                        <Link asChild>
                          <RouterLink to="/app/files">Files</RouterLink>
                        </Link>
                      </Drawer.CloseTrigger>
                    </Box>
                    <Box mb={1}>
                      <Drawer.CloseTrigger asChild>
                        <Link asChild>
                          <RouterLink to="/app/backups">Backups</RouterLink>
                        </Link>
                      </Drawer.CloseTrigger>
                    </Box>

                    <Box mt={4} mb={2} fontWeight="bold" color="green.300">
                      Gameplay
                    </Box>
                    <Box mb={1}>
                      <Drawer.CloseTrigger asChild>
                        <Link asChild>
                          <RouterLink to="/app/whitelist">Whitelist</RouterLink>
                        </Link>
                      </Drawer.CloseTrigger>
                    </Box>
                    <Box mb={1}>
                      <Drawer.CloseTrigger asChild>
                        <Link asChild>
                          <RouterLink to="/app/modpack">Modpack</RouterLink>
                        </Link>
                      </Drawer.CloseTrigger>
                    </Box>

                    {/* {role === 'owner' && (
                      <>
                        <Box mt={4} mb={2} fontWeight="bold" color="green.300">
                          Admin
                        </Box>
                        <Box mb={1}>
                          <Drawer.CloseTrigger asChild>
                            <Link asChild>
                              <RouterLink to="/app/users/new">New User</RouterLink>
                            </Link>
                          </Drawer.CloseTrigger>
                        </Box>
                      </>
                    )} */}
                  </Drawer.Body>
                </Drawer.Content>
              </Drawer.Positioner>
            </Drawer.Root>
          )}
        </Flex>

        <HStack gap={3} align="center">
          <HStack gap={2} align="center">
            <SimpleSelect
              value={language}
              onChange={(v) => setLanguage(v)}
              options={[
                { value: 'it', label: 'Italiano' },
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
              ]}
            />
          </HStack>

          {isLoggedIn ? (
            <GlassButton size="sm" onClick={onLogout} type="button">
              Disconnect
            </GlassButton>
          ) : (
            <Link
              asChild
              color="var(--chakra-colors-link)"
              _hover={{ textDecoration: 'none', color: 'var(--chakra-colors-link)' }}
            >
              <RouterLink to="/login">{t.loginTitle}</RouterLink>
            </Link>
          )}
        </HStack>
      </Flex>
    </Box>
  )
}
