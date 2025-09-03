import { useQuery } from '@tanstack/react-query'

export type SupportedVersions = {
  minecraft: string[]
  loaders: Record<string, { label: string; versions: Record<string, string> }>
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
