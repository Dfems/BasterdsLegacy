import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import AuthContext from '@/entities/user/AuthContext'
import type { UiSettings, UploadResponse } from '@/types'

export const useUiSettings = () => {
  const { role, token } = useContext(AuthContext)
  const [settings, setSettings] = useState<UiSettings>({ backgroundImage: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const authHeaders = useMemo(() => {
    const h = new Headers()
    if (token) h.set('Authorization', `Bearer ${token}`)
    return h
  }, [token])

  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const url = token ? '/api/settings/ui' : '/api/settings/ui-public'
      const response = await fetch(url, { headers: authHeaders })
      if (!response.ok) {
        throw new Error('Failed to fetch UI settings')
      }
      const data = (await response.json()) as UiSettings
      setSettings(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [authHeaders, token])

  const updateBackgroundImage = useCallback(
    async (backgroundImage: string | null): Promise<void> => {
      if (role !== 'owner') {
        throw new Error('Only owners can update UI settings')
      }

      try {
        const putHeaders = new Headers({ 'Content-Type': 'application/json' })
        if (token) putHeaders.set('Authorization', `Bearer ${token}`)
        const response = await fetch('/api/settings/ui', {
          method: 'PUT',
          headers: putHeaders,
          body: JSON.stringify({ backgroundImage }),
        })

        if (!response.ok) {
          throw new Error('Failed to update UI settings')
        }

        // Notify other hook instances to refresh
        try {
          window.dispatchEvent(new CustomEvent('ui-settings:changed'))
        } catch {
          // ignore if dispatch fails (SSR/tests)
        }

        // Refetch settings to ensure all components are synchronized
        await fetchSettings()
      } catch (err) {
        throw new Error((err as Error).message)
      }
    },
    [role, fetchSettings, token]
  )

  const uploadBackgroundImage = useCallback(
    async (file: File): Promise<UploadResponse> => {
      if (role !== 'owner') {
        throw new Error('Only owners can upload background images')
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const postHeaders = new Headers()
        if (token) postHeaders.set('Authorization', `Bearer ${token}`)
        const response = await fetch('/api/settings/background-upload', {
          method: 'POST',
          body: formData,
          headers: postHeaders,
        })

        const result = (await response.json()) as UploadResponse

        if (!response.ok) {
          throw new Error(result.error || 'Failed to upload image')
        }

        // Notify other hook instances to refresh
        try {
          window.dispatchEvent(new CustomEvent('ui-settings:changed'))
        } catch {
          // ignore if dispatch fails (SSR/tests)
        }

        // Refetch settings to ensure all components are synchronized
        await fetchSettings()

        return result
      } catch (err) {
        throw new Error((err as Error).message)
      }
    },
    [role, fetchSettings, token]
  )

  const getBackgroundImageUrl = useCallback((filename: string | null): string | null => {
    if (!filename) return null
    return `/api/settings/background/${filename}`
  }, [])

  useEffect(() => {
    void fetchSettings()

    // Cross-tab / cross-instance sync: listen for settings changes
    const onChanged = () => {
      void fetchSettings()
    }
    try {
      window.addEventListener('ui-settings:changed', onChanged as EventListener)
    } catch {
      // ignore in non-browser env
    }

    return () => {
      try {
        window.removeEventListener('ui-settings:changed', onChanged as EventListener)
      } catch {
        // ignore
      }
    }
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    updateBackgroundImage,
    uploadBackgroundImage,
    getBackgroundImageUrl,
    refetch: fetchSettings,
    isOwner: role === 'owner',
  }
}
