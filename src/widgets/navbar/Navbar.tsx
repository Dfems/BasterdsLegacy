import type { JSX } from 'react'
import { useContext, useMemo } from 'react'

import { Box, Flex, HStack, Link, Menu } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import AuthContext from '@/entities/user/AuthContext'
import { GlassButton } from '@/shared/components/GlassButton'
import { SimpleSelect } from '@/shared/components/SimpleSelect'
import useLanguage from '@/shared/hooks/useLanguage'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/libs/constants/languages'

interface NavbarProps {
  isLoggedIn: boolean
  onLogout: () => void
}

export default function Navbar({ isLoggedIn, onLogout }: NavbarProps): JSX.Element {
  useContext(AuthContext)
  const { language, setLanguage, t } = useLanguage()
  const location = useLocation()

  const mobileItems = useMemo(
    () =>
      isLoggedIn
        ? [
            { to: '/app/console', label: 'Console', icon: '🖥️' },
            { to: '/app/files', label: 'Files', icon: '📂' },
            { to: '/app/backups', label: 'Backups', icon: '💾' },
            { to: '/app/dashboard', label: 'Dash', icon: '📊' },
            { to: '/app/settings', label: 'Settings', icon: '⚙️' },
          ]
        : [
            { to: '/', label: t.appName, icon: '🏠' },
            { to: '/login', label: t.loginTitle, icon: '🔐' },
          ],
    [isLoggedIn, t.appName, t.loginTitle]
  )

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

          {/* Mobile: bottom navigation handled below */}
        </Flex>

        <HStack gap={3} align="center" display={{ base: 'none', md: 'flex' }}>
          <HStack gap={2} align="center">
            <SimpleSelect
              value={language}
              onChange={(v) => setLanguage(v as SupportedLanguage)}
              options={SUPPORTED_LANGUAGES}
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
      {/* Fixed bottom mobile nav */}
      <Box
        display={{ base: 'flex', md: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="var(--chakra-colors-surfaceSolid)"
        borderTopWidth="1px"
        borderColor="var(--chakra-colors-border)"
        zIndex={100}
      >
        <HStack w="100%" justify="space-around" py={2}>
          {mobileItems.map((it) => {
            const active = location.pathname.startsWith(it.to)
            return (
              <Link
                key={it.to}
                asChild
                color={active ? 'var(--chakra-colors-brand)' : 'var(--chakra-colors-text)'}
                _hover={{ textDecoration: 'none', color: 'var(--chakra-colors-brand)' }}
              >
                <RouterLink
                  to={it.to}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                >
                  <Box aria-hidden fontSize="lg" lineHeight="1">
                    {it.icon}
                  </Box>
                  <Box fontSize="xs">{it.label}</Box>
                </RouterLink>
              </Link>
            )
          })}
        </HStack>
      </Box>
    </Box>
  )
}
