import type { JSX } from 'react'

import { Box, HStack, Text } from '@chakra-ui/react'

import { useTranslation } from '@/shared/libs/i18n'

export type SettingsTab = 'overview' | 'environment' | 'ui' | 'server' | 'advanced'

type TabItem = {
  id: SettingsTab
  icon: string
}

type SettingsTabNavigationProps = {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  availableTabs: SettingsTab[]
}

export const SettingsTabNavigation = ({
  activeTab,
  onTabChange,
  availableTabs,
}: SettingsTabNavigationProps): JSX.Element => {
  const { t } = useTranslation()

  const allTabs: TabItem[] = [
    {
      id: 'overview',
      icon: '📊',
    },
    {
      id: 'environment',
      icon: '⚙️',
    },
    {
      id: 'ui',
      icon: '🎨',
    },
    {
      id: 'server',
      icon: '🖥️',
    },
    {
      id: 'advanced',
      icon: '🔧',
    },
  ]

  const visibleTabs = allTabs.filter((tab) => availableTabs.includes(tab.id))

  return (
    <Box
      bg="surfaceSolid"
      borderRadius="xl"
      p={2}
      borderWidth="1px"
      borderColor="borderAccent"
      boxShadow="lg"
      style={{ backdropFilter: 'blur(16px) saturate(150%)' }}
    >
      <HStack gap={1} wrap={{ base: 'wrap', lg: 'nowrap' }}>
        {visibleTabs.map((tab) => (
          <Box
            key={tab.id}
            as="button"
            onClick={() => onTabChange(tab.id)}
            bg={activeTab === tab.id ? 'accent.subtle' : 'transparent'}
            color={activeTab === tab.id ? 'accent.fg' : 'text'}
            borderRadius="lg"
            p={3}
            minW={{ base: 'auto', md: '140px' }}
            flex={{ base: '1 1 auto', lg: '1' }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              bg: activeTab === tab.id ? 'accent.subtle' : 'surface',
              transform: 'translateY(-1px)',
              boxShadow: 'md',
            }}
            _active={{
              transform: 'translateY(0)',
            }}
            position="relative"
            overflow="hidden"
          >
            {/* Animated background gradient on active */}
            {activeTab === tab.id && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bgGradient="linear(45deg, accent.300/20, accent.500/20)"
                borderRadius="lg"
                animation="pulse 2s infinite"
              />
            )}

            <Box position="relative" zIndex={1}>
              <Text fontSize="xl" mb={1}>
                {tab.icon}
              </Text>
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={activeTab === tab.id ? 'semibold' : 'medium'}
                lineHeight="short"
                mb={1}
              >
                {t.settings.tabs[tab.id].title}
              </Text>
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                color={activeTab === tab.id ? 'accent.fg/80' : 'textMuted'}
                lineHeight="shorter"
                display={{ base: 'none', md: 'block' }}
              >
                {t.settings.tabs[tab.id].description}
              </Text>
            </Box>
          </Box>
        ))}
      </HStack>
    </Box>
  )
}
