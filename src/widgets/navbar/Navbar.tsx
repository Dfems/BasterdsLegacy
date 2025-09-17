import type { JSX } from 'react'
import { useContext, useMemo } from 'react'

import { Badge, Box, Flex, HStack, Link, Menu, Text, VStack } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import AuthContext from '@/entities/user/AuthContext'
import { GlassButton } from '@/shared/components/GlassButton'
import { SimpleSelect } from '@/shared/components/SimpleSelect'
import { StatusIndicator } from '@/shared/components/StatusIndicator'
import useLanguage from '@/shared/hooks/useLanguage'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/libs/constants/languages'

interface NavbarProps {
  isLoggedIn: boolean
  onLogout: () => void
}

export default function Navbar({ isLoggedIn, onLogout }: NavbarProps): JSX.Element {
  useContext(AuthContext)
  const { navigation, common, auth, dashboard, language, setLanguage } = useLanguage()
  const location = useLocation()

  const mobileItems = useMemo(
    () =>
      isLoggedIn
        ? [
            { to: '/app/console', label: navigation.console, icon: '🖥️', color: 'blue' },
            { to: '/app/files', label: navigation.files, icon: '📂', color: 'green' },
            { to: '/app/backups', label: navigation.backups, icon: '💾', color: 'purple' },
            { to: '/app/dashboard', label: navigation.dashboard, icon: '📊', color: 'orange' },
            { to: '/app/settings', label: navigation.settings, icon: '⚙️', color: 'gray' },
          ]
        : [
            { to: '/', label: common.appName, icon: '🏠', color: 'blue' },
            { to: '/login', label: auth.loginTitle, icon: '🔐', color: 'green' },
          ],
    [isLoggedIn, navigation, common.appName, auth.loginTitle]
  )

  return (
    <>
      {/* Modern Desktop Navbar */}
      <Box
        as="header"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(12px)"
        borderBottomWidth="1px"
        borderColor="var(--chakra-colors-border)"
        boxShadow="0 4px 32px rgba(0, 0, 0, 0.1)"
        color="var(--chakra-colors-text)"
        _dark={{
          bg: 'rgba(26, 32, 44, 0.95)',
          borderColor: 'gray.700',
          boxShadow: '0 4px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Animated gradient background */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient="linear(90deg, brand.500/5, purple.500/5, blue.500/5)"
          opacity={0.6}
        />

        <Flex
          as="nav"
          aria-label="Main navigation"
          align="center"
          justify="space-between"
          px={6}
          py={3}
          w="100%"
          position="relative"
          zIndex={1}
        >
          {/* Logo and Brand */}
          <Flex gap={4} align="center">
            <Link
              asChild
              fontWeight={800}
              fontSize="xl"
              color="brand.500"
              _hover={{
                textDecoration: 'none',
                color: 'brand.600',
                transform: 'scale(1.05)',
                transition: 'all 0.2s ease',
              }}
              transition="all 0.2s ease"
            >
              <RouterLink to="/">
                <HStack gap={2}>
                  <Text fontSize="2xl">🎮</Text>
                  <Text>{common.appName}</Text>
                </HStack>
              </RouterLink>
            </Link>

            {/* Desktop: Modern menu groups */}
            {isLoggedIn && (
              <HStack gap={3} align="center" display={{ base: 'none', lg: 'flex' }}>
                <Menu.Root data-variant="glass">
                  <Menu.Trigger asChild>
                    <GlassButton size="sm" colorScheme="blue">
                      <HStack gap={2}>
                        <Text>🖥️</Text>
                        <Text>{navigation.server}</Text>
                        <Text fontSize="xs">▾</Text>
                      </HStack>
                    </GlassButton>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content
                      bg="rgba(255, 255, 255, 0.95)"
                      backdropFilter="blur(12px)"
                      borderColor="gray.200"
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.15)"
                      _dark={{
                        bg: 'rgba(26, 32, 44, 0.95)',
                        borderColor: 'gray.700',
                      }}
                    >
                      <Menu.Item value="console" asChild>
                        <RouterLink
                          to="/app/console"
                          style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text>🖥️</Text>
                          <Text>{navigation.console}</Text>
                        </RouterLink>
                      </Menu.Item>
                      <Menu.Item value="dashboard" asChild>
                        <RouterLink
                          to="/app/dashboard"
                          style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text>📊</Text>
                          <Text>{navigation.dashboard}</Text>
                        </RouterLink>
                      </Menu.Item>
                      <Menu.Item value="settings" asChild>
                        <RouterLink
                          to="/app/settings"
                          style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text>⚙️</Text>
                          <Text>{navigation.settings}</Text>
                        </RouterLink>
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>

                <Menu.Root data-variant="glass">
                  <Menu.Trigger asChild>
                    <GlassButton size="sm" colorScheme="green">
                      <HStack gap={2}>
                        <Text>💾</Text>
                        <Text>{navigation.storage}</Text>
                        <Text fontSize="xs">▾</Text>
                      </HStack>
                    </GlassButton>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content
                      bg="rgba(255, 255, 255, 0.95)"
                      backdropFilter="blur(12px)"
                      borderColor="gray.200"
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.15)"
                      _dark={{
                        bg: 'rgba(26, 32, 44, 0.95)',
                        borderColor: 'gray.700',
                      }}
                    >
                      <Menu.Item value="files" asChild>
                        <RouterLink
                          to="/app/files"
                          style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text>📂</Text>
                          <Text>{navigation.files}</Text>
                        </RouterLink>
                      </Menu.Item>
                      <Menu.Item value="backups" asChild>
                        <RouterLink
                          to="/app/backups"
                          style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text>💾</Text>
                          <Text>{navigation.backups}</Text>
                        </RouterLink>
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>

                <Menu.Root data-variant="glass">
                  <Menu.Trigger asChild>
                    <GlassButton size="sm" colorScheme="purple">
                      <HStack gap={2}>
                        <Text>🎮</Text>
                        <Text>{navigation.gameplay}</Text>
                        <Text fontSize="xs">▾</Text>
                      </HStack>
                    </GlassButton>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content
                      bg="rgba(255, 255, 255, 0.95)"
                      backdropFilter="blur(12px)"
                      borderColor="gray.200"
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.15)"
                      _dark={{
                        bg: 'rgba(26, 32, 44, 0.95)',
                        borderColor: 'gray.700',
                      }}
                    >
                      <Menu.Item value="whitelist" asChild>
                        <RouterLink
                          to="/app/whitelist"
                          style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text>👥</Text>
                          <Text>{navigation.whitelist}</Text>
                        </RouterLink>
                      </Menu.Item>
                      <Menu.Item value="modpack" asChild>
                        <RouterLink
                          to="/app/modpack"
                          style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text>📦</Text>
                          <Text>{navigation.modpack}</Text>
                        </RouterLink>
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>
              </HStack>
            )}
          </Flex>

          {/* Right side controls */}
          <HStack gap={4} align="center" display={{ base: 'none', md: 'flex' }}>
            {/* Language selector with modern styling */}
            <HStack gap={2} align="center">
              <Text fontSize="sm" color="textMuted">
                🌐
              </Text>
              <SimpleSelect
                value={language}
                onChange={(v) => setLanguage(v as SupportedLanguage)}
                options={SUPPORTED_LANGUAGES}
              />
            </HStack>

            {/* User status and logout */}
            {isLoggedIn ? (
              <HStack gap={3}>
                {/* <StatusIndicator status="online" label={common.admin} size="sm" /> */}
                <GlassButton
                  size="sm"
                  onClick={onLogout}
                  type="button"
                  colorScheme="red"
                  _hover={{
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <HStack gap={2}>
                    <Text>🚪</Text>
                    <Text>{common.logout}</Text>
                  </HStack>
                </GlassButton>
              </HStack>
            ) : (
              <GlassButton asChild colorScheme="brand">
                <RouterLink to="/login">
                  <HStack gap={2}>
                    <Text>🔐</Text>
                    <Text>{auth.loginTitle}</Text>
                  </HStack>
                </RouterLink>
              </GlassButton>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Modern Mobile Bottom Navigation */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(12px)"
        borderTopWidth="1px"
        borderColor="var(--chakra-colors-border)"
        boxShadow="0 -4px 32px rgba(0, 0, 0, 0.1)"
        zIndex={100}
        _dark={{
          bg: 'rgba(26, 32, 44, 0.95)',
          borderColor: 'gray.700',
          boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Animated gradient background */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgGradient="linear(90deg, brand.500/3, purple.500/3, blue.500/3)"
          opacity={0.6}
        />

        <HStack w="100%" justify="space-around" py={2} position="relative" zIndex={1}>
          {mobileItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <Link key={item.to} asChild _hover={{ textDecoration: 'none' }}>
                <RouterLink
                  to={item.to}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 12px',
                    borderRadius: 12,
                    minWidth: 64,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <VStack gap={1} align="center">
                    <Box
                      fontSize="xl"
                      lineHeight="1"
                      color={isActive ? 'brand.500' : 'gray.500'}
                      transform={isActive ? 'scale(1.1)' : 'scale(1)'}
                      transition="all 0.2s ease"
                    >
                      {item.icon}
                    </Box>
                    <Text
                      fontSize="xs"
                      fontWeight={isActive ? 'bold' : 'medium'}
                      color={isActive ? 'brand.500' : 'gray.600'}
                      textAlign="center"
                    >
                      {item.label}
                    </Text>
                    {isActive && (
                      <Badge
                        size="xs"
                        colorScheme={item.color}
                        variant="solid"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                      >
                        •
                      </Badge>
                    )}
                  </VStack>
                </RouterLink>
              </Link>
            )
          })}

          {/* Mobile logout/login button */}
          {isLoggedIn ? (
            <Box
              as="button"
              onClick={onLogout}
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={1}
              p={2}
              borderRadius={12}
              minWidth={16}
              transition="all 0.2s ease"
              _hover={{
                bg: 'red.50',
                _dark: { bg: 'red.900/20' },
              }}
            >
              <VStack gap={1} align="center">
                <Text fontSize="xl" color="red.500">
                  🚪
                </Text>
                <Text fontSize="xs" fontWeight="medium" color="red.600" textAlign="center">
                  {common.logout}
                </Text>
              </VStack>
            </Box>
          ) : (
            <Link asChild _hover={{ textDecoration: 'none' }}>
              <RouterLink
                to="/login"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 12,
                  minWidth: 64,
                }}
              >
                <VStack gap={1} align="center">
                  <Text fontSize="xl" color="brand.500">
                    🔐
                  </Text>
                  <Text fontSize="xs" fontWeight="medium" color="brand.600" textAlign="center">
                    {auth.loginTitle}
                  </Text>
                </VStack>
              </RouterLink>
            </Link>
          )}
        </HStack>

        {/* Mobile language and status bar */}
        {isLoggedIn && (
          <Box
            px={4}
            pb={2}
            display="flex"
            justifyContent="center"
            borderTopWidth="1px"
            borderColor="gray.200"
            _dark={{ borderColor: 'gray.700' }}
          >
            <HStack gap={4} fontSize="xs">
              <HStack gap={1}>
                <Text>🌐</Text>
                <SimpleSelect
                  value={language}
                  onChange={(v) => setLanguage(v as SupportedLanguage)}
                  options={SUPPORTED_LANGUAGES}
                />
              </HStack>
              <StatusIndicator
                status="online"
                label={`${common.admin} ${dashboard.online}`}
                size="sm"
              />
            </HStack>
          </Box>
        )}
      </Box>
    </>
  )
}
