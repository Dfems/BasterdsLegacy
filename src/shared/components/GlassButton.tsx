import type { AnchorHTMLAttributes, ComponentProps, JSX } from 'react'

import { Button } from '@chakra-ui/react'

type AnchorExtras = Partial<
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'download'>
>

type Props = ComponentProps<typeof Button> & AnchorExtras

const GlassButton = (props: Props): JSX.Element => {
  const { variant, ...rest } = props
  return <Button data-variant="glass" variant={variant ?? 'outline'} {...rest} />
}

export { GlassButton }
