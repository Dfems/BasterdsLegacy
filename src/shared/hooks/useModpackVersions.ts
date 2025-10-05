import { useQuery } from '@tanstack/react-query'

export type VersionInfo = {
  version: string
  stable: boolean
  recommended?: boolean
  latest?: boolean
}

export type SupportedVersions = {
  minecraft: string[]
  loaders: Record<string, { label: string; versions: Record<string, VersionInfo[]> }>
}

export const useModpackVersions = () => {
  return useQuery({
    queryKey: ['modpack', 'versions'],
    queryFn: async (): Promise<SupportedVersions> => {
      const response = await fetch('/api/modpack/versions')
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle versioni')
      }
      const data = await response.json()
      return data.versions
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
  })
}
