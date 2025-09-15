import { type JSX } from 'react'

import { Box, Heading, Text } from '@chakra-ui/react'

type ModernHeaderProps = {
  title: string
  description: string
  emoji?: string
  gradient?: string
}

export const ModernHeader = ({
  title,
  description,
  emoji = '✨',
  gradient = 'linear(135deg, accent.200/20, accent.400/10)',
}: ModernHeaderProps): JSX.Element => (
  <Box
    mb={8}
    textAlign="center"
    bgGradient={gradient}
    borderRadius="2xl"
    p={8}
    position="relative"
    overflow="hidden"
  >
    {/* Animated background elements */}
    <Box
      position="absolute"
      top="-50%"
      right="-50%"
      w="200%"
      h="200%"
      bgGradient="radial(circle, accent.300/5, transparent 70%)"
      animation="spin 20s linear infinite"
    />

    <Box position="relative" zIndex={1}>
      <Text fontSize="4xl" mb={2}>
        {emoji}
      </Text>
      <Heading fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }} mb={4} color="accent.fg">
        {title}
      </Heading>
      <Text color="textMuted" fontSize={{ base: 'md', md: 'lg' }} maxW="2xl" mx="auto">
        {description}
      </Text>
    </Box>
  </Box>
)
