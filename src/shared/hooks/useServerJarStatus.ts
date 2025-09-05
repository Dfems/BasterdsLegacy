import { useQuery } from '@tanstack/react-query'

export type ServerJarStatus = {
  hasJar: boolean
  jarType: 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt' | 'custom' | null
  jarName: string | null
  canStart: boolean
}

export const useServerJarStatus = () => {
  return useQuery({
    queryKey: ['server', 'jar-status'],
    queryFn: async (): Promise<ServerJarStatus> => {
      const response = await fetch('/api/server/jar-status')
      if (!response.ok) {
        throw new Error('Errore nel caricamento dello stato JAR')
      }
      return response.json()
    },
    staleTime: 1000 * 30, // 30 secondi
    refetchInterval: 1000 * 60, // Aggiorna ogni minuto
  })
}
