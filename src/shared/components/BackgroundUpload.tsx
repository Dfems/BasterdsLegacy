import { useCallback, useRef, useState, type JSX } from 'react'

import { Box, HStack, Image, Text, VStack } from '@chakra-ui/react'

import { GlassButton } from '@/shared/components/GlassButton'
import { useUiSettings } from '@/shared/hooks'
import { useTranslation } from '@/shared/libs/i18n'

import { GlassCard } from './GlassCard'

type Props = {
  onUploadSuccess?: (filename: string) => void
  onUploadError?: (error: string) => void
}

export const BackgroundUpload = ({ onUploadSuccess, onUploadError }: Props): JSX.Element => {
  const { t } = useTranslation()
  const { uploadBackgroundImage, updateBackgroundImage, getBackgroundImageUrl, settings, isOwner } =
    useUiSettings()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = 'Tipo di file non valido. Solo JPEG, PNG, WebP e GIF sono permessi.'
        setError(errorMsg)
        onUploadError?.(errorMsg)
        return
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        const errorMsg = 'File troppo grande. Dimensione massima: 5MB.'
        setError(errorMsg)
        onUploadError?.(errorMsg)
        return
      }

      setUploading(true)
      setError(null)

      try {
        const result = await uploadBackgroundImage(file)
        if (result.success && result.filename) {
          onUploadSuccess?.(result.filename)
        }
      } catch (err) {
        const errorMsg = (err as Error).message
        setError(errorMsg)
        onUploadError?.(errorMsg)
      } finally {
        setUploading(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [uploadBackgroundImage, onUploadSuccess, onUploadError]
  )

  const handleRemoveBackground = useCallback(async (): Promise<void> => {
    try {
      await updateBackgroundImage(null)
    } catch (err) {
      const errorMsg = (err as Error).message
      setError(errorMsg)
      onUploadError?.(errorMsg)
    }
  }, [updateBackgroundImage, onUploadError])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  if (!isOwner) {
    return <></>
  }

  return (
    <GlassCard p={4} inset>
      <VStack align="stretch" gap={3}>
        <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
          Sfondo Personalizzato
        </Text>

        {settings.backgroundImage && (
          <Box>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted" mb={2}>
              Anteprima corrente:
            </Text>
            <Image
              src={getBackgroundImageUrl(settings.backgroundImage) || undefined}
              alt="Background preview"
              maxH="100px"
              objectFit="cover"
              borderRadius="md"
              border="1px solid"
              borderColor="border"
            />
          </Box>
        )}

        {error && (
          <Text color="accent.danger" fontSize={{ base: 'xs', md: 'sm' }}>
            {error}
          </Text>
        )}

        <HStack gap={2} wrap="wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploading}
          />

          <GlassButton
            onClick={handleUploadClick}
            variant="outline"
            size={{ base: 'sm', md: 'md' }}
            loading={uploading}
            disabled={uploading}
          >
            {uploading ? t.common.loading : t.common.uploadImage}
          </GlassButton>

          {settings.backgroundImage && (
            <GlassButton
              onClick={handleRemoveBackground}
              variant="outline"
              size={{ base: 'sm', md: 'md' }}
              colorScheme="red"
              disabled={uploading}
            >
              Rimuovi Sfondo
            </GlassButton>
          )}
        </HStack>

        <Text fontSize={{ base: 'xs', md: 'sm' }} color="textMuted">
          Formati supportati: JPEG, PNG, WebP, GIF. Dimensione massima: 5MB.
        </Text>
      </VStack>
    </GlassCard>
  )
}
