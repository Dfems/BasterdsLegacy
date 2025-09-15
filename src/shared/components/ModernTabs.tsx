import { type JSX } from 'react'

import { Box, HStack, Text } from '@chakra-ui/react'

import { GlassButton } from './GlassButton'

type Tab = {
  id: string
  label: string
  icon: string
  count?: number
}

type ModernTabsProps = {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'pills' | 'underlined'
}

export const ModernTabs = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'pills',
}: ModernTabsProps): JSX.Element => {
  if (variant === 'underlined') {
    return (
      <Box borderBottomWidth="1px" borderColor="whiteAlpha.200">
        <HStack spacing={0} overflowX="auto" pb={2}>
          {tabs.map((tab) => (
            <Box
              key={tab.id}
              as="button"
              onClick={() => onTabChange(tab.id)}
              px={4}
              py={3}
              position="relative"
              borderBottomWidth="2px"
              borderColor={activeTab === tab.id ? 'accent.fg' : 'transparent'}
              color={activeTab === tab.id ? 'accent.fg' : 'textMuted'}
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={activeTab === tab.id ? 'bold' : 'medium'}
              transition="all 0.2s"
              _hover={{
                color: 'accent.fg',
                borderColor: activeTab === tab.id ? 'accent.fg' : 'accent.fg/50',
              }}
              whiteSpace="nowrap"
            >
              <HStack spacing={2}>
                <Text>{tab.icon}</Text>
                <Text>{tab.label}</Text>
                {tab.count !== undefined && (
                  <Box
                    bg="accent.fg"
                    color="white"
                    borderRadius="full"
                    px={2}
                    py={0.5}
                    fontSize="xs"
                    fontWeight="bold"
                    minW="20px"
                    textAlign="center"
                  >
                    {tab.count}
                  </Box>
                )}
              </HStack>
            </Box>
          ))}
        </HStack>
      </Box>
    )
  }

  return (
    <HStack spacing={2} wrap="wrap" justify="center">
      {tabs.map((tab) => (
        <GlassButton
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          variant={activeTab === tab.id ? 'solid' : 'ghost'}
          size={{ base: 'sm', md: 'md' }}
          leftIcon={<Text>{tab.icon}</Text>}
          position="relative"
        >
          {tab.label}
          {tab.count !== undefined && (
            <Box
              position="absolute"
              top="-8px"
              right="-8px"
              bg="accent.danger"
              color="white"
              borderRadius="full"
              px={1.5}
              py={0.5}
              fontSize="xs"
              fontWeight="bold"
              minW="20px"
              textAlign="center"
            >
              {tab.count}
            </Box>
          )}
        </GlassButton>
      ))}
    </HStack>
  )
}