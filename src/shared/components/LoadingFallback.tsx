import type { JSX } from 'react'

import { useTranslation } from '@/shared/libs/i18n'

const LoadingFallback = (): JSX.Element => {
  const { t } = useTranslation()

  return <div style={{ padding: 16 }}>{t.common.loading}</div>
}

export default LoadingFallback
