import type { JSX } from 'react'

import { Menu, Portal, type ButtonProps } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import type { Option } from '@/types/common'

type Props = {
  value: string
  options: Option[]
  onChange: (v: string) => void
  size?: ButtonProps['size']
  buttonProps?: ButtonProps
}

export const SimpleSelect = ({
  value,
  options,
  onChange,
  size = 'sm',
  buttonProps,
}: Props): JSX.Element => {
  const current = options.find((o) => o.value === value)?.label ?? value
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <GlassButton size={size} {...buttonProps}>
          {current}
        </GlassButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner zIndex="9999">
          <Menu.Content
            data-variant="glass"
            boxShadow="lg"
            color="var(--chakra-colors-text)"
            zIndex={9999}
          >
            {options.map((o) => (
              <Menu.Item
                key={o.value}
                value={o.value}
                onClick={() => onChange(o.value)}
                color={o.value === value ? 'accent' : 'inherit'}
              >
                {o.label} {o.value === value ? '✓' : ''}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
