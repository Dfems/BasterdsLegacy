import { useQuery } from '@tanstack/react-query'

export type ModpackInfo = {
  loader: string | null
  mcVersion: string | null
  loaderVersion: string | null
  mode: string | null
}

export const useModpackInfo = () => {
  return useQuery({
    queryKey: ['modpack', 'info'],
    queryFn: async (): Promise<ModpackInfo> => {
      const response = await fetch('/api/modpack/info')
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle informazioni modpack')
      }
      return response.json()
    },
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 60 * 5, // Aggiorna ogni 5 minuti
  })
}
