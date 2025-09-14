import { useCallback, useEffect, useMemo, useState, type JSX } from 'react'

import { HStack, Input, Text, VStack } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { GlassCard } from '@/shared/components/GlassCard'
import { useUiSettings } from '@/shared/hooks'
import { useTranslation } from '@/shared/libs/i18n'

const readSeconds = (): number => {
  try {
    const v = localStorage.getItem('bgRotateSeconds')
    if (!v) return 15
    const n = Number(v)
    return Number.isFinite(n) ? n : 15
  } catch {
    return 15
  }
}

const writeSeconds = (n: number) => {
  localStorage.setItem('bgRotateSeconds', String(n))
  try {
    window.dispatchEvent(new CustomEvent('bg-rotate-seconds:changed'))
  } catch {}
}

const writeEnabled = (v: boolean) => {
  localStorage.setItem('bgRotateEnabled', String(v))
  try {
    window.dispatchEvent(new CustomEvent('bg-rotate-enabled:changed'))
  } catch {}
}

export const BackgroundRotationSettings = (): JSX.Element => {
  const { isOwner } = useUiSettings()
  const { t } = useTranslation()
  const [value, setValue] = useState<string>(() => String(readSeconds()))
  const [serverValue, setServerValue] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [enabled, setEnabled] = useState<boolean>(true)
  const [serverEnabled, setServerEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bgRotateSeconds') setValue(String(readSeconds()))
      if (e.key === 'bgRotateEnabled') setEnabled(e.newValue === 'true')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const current = useMemo(() => {
    const n = Math.max(3, Math.floor(Number(value) || 0))
    return n
  }, [value])

  // Load server value on mount for canonical config
  useEffect(() => {
    const run = async () => {
      try {
        const r = await fetch('/api/settings/ui-rotation')
        if (!r.ok) return
        const data = (await r.json()) as { seconds: number; enabled: boolean }
        setServerValue(data.seconds)
        setValue(String(data.seconds))
        setEnabled(Boolean(data.enabled))
        setServerEnabled(Boolean(data.enabled))
      } catch {
        // ignore
      }
    }
    void run()
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    try {
      // Persist server-side (owner only)
      const token = localStorage.getItem('token')
      const r = await fetch('/api/settings/ui-rotation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ seconds: current, enabled }),
      })
      if (!r.ok) throw new Error('Failed to save rotation seconds')
      const body = (await r.json()) as { seconds: number; enabled: boolean }
      
      // Update local storage immediately after successful server save
      writeSeconds(body.seconds)
      writeEnabled(Boolean(body.enabled))
      
      // Update state to reflect server response
      setServerValue(body.seconds)
      setServerEnabled(Boolean(body.enabled))
      setValue(String(body.seconds))
      setEnabled(Boolean(body.enabled))
      
      setSavedMsg(t.settings.environment.success)
      // auto-hide message
      window.setTimeout(() => setSavedMsg(null), 2000)
    } catch (error) {
      setSavedMsg(`Errore: ${(error as Error).message}`)
      window.setTimeout(() => setSavedMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }, [current, enabled, t.settings.environment.success])

  if (!isOwner) return <></>

  return (
    <GlassCard inset p={{ base: 3, md: 4 }}>
      <VStack align="stretch" gap={3}>
        <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
          {t.settings.backgroundRotation.title}
        </Text>
        <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
          {t.settings.backgroundRotation.description}
        </Text>
        <HStack gap={3} align="center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            aria-label={t.settings.backgroundRotation.toggle}
          />
          <Text fontSize={{ base: 'xs', md: 'sm' }}>
            {enabled ? t.settings.backgroundRotation.enabled : t.settings.backgroundRotation.disabled}
          </Text>
        </HStack>
        <HStack gap={2}>
          <Input
            type="number"
            min={3}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            width={{ base: '100%', sm: '160px' }}
            aria-label={t.settings.backgroundRotation.secondsLabel}
          />
          <GlassButton
            onClick={save}
            variant="outline"
            size={{ base: 'sm', md: 'md' }}
            loading={saving}
            disabled={
              saving ||
              (serverValue !== null && serverEnabled !== null &&
               current === serverValue && enabled === serverEnabled)
            }
          >
            {t.common.save}
          </GlassButton>
        </HStack>
        <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
          {t.settings.backgroundRotation.current.replace('{seconds}', String(current))}
        </Text>
        {savedMsg && (
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="accent.success">
            {savedMsg}
          </Text>
        )}
      </VStack>
    </GlassCard>
  )
}
