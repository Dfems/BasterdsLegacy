import { useCallback, useContext, useEffect, useState } from 'react'

import AuthContext from '@/entities/user/AuthContext'
import type { UiSettings, UploadResponse } from '@/types'

export const useUiSettings = () => {
  const { role } = useContext(AuthContext)
  const [settings, setSettings] = useState<UiSettings>({ backgroundImage: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/settings/ui')
      if (!response.ok) {
        throw new Error('Failed to fetch UI settings')
      }
      const data = (await response.json()) as UiSettings
      console.log('UiSettings fetched:', data) // Debug log
      setSettings(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateBackgroundImage = useCallback(
    async (backgroundImage: string | null): Promise<void> => {
      if (role !== 'owner') {
        throw new Error('Only owners can update UI settings')
      }

      try {
        const response = await fetch('/api/settings/ui', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ backgroundImage }),
        })

        if (!response.ok) {
          throw new Error('Failed to update UI settings')
        }

        // Refetch settings to ensure all components are synchronized
        await fetchSettings()
      } catch (err) {
        throw new Error((err as Error).message)
      }
    },
    [role, fetchSettings]
  )

  const uploadBackgroundImage = useCallback(
    async (file: File): Promise<UploadResponse> => {
      if (role !== 'owner') {
        throw new Error('Only owners can upload background images')
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/settings/background-upload', {
          method: 'POST',
          body: formData,
        })

        const result = (await response.json()) as UploadResponse

        if (!response.ok) {
          throw new Error(result.error || 'Failed to upload image')
        }

        // Refetch settings to ensure all components are synchronized
        await fetchSettings()

        return result
      } catch (err) {
        throw new Error((err as Error).message)
      }
    },
    [role, fetchSettings]
  )

  const getBackgroundImageUrl = useCallback((filename: string | null): string | null => {
    if (!filename) return null
    return `/api/settings/background/${filename}`
  }, [])

  useEffect(() => {
    void fetchSettings()
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
