import { useQuery } from '@tanstack/react-query'

export type ButtonsSettings = {
  launcher: {
    visible: boolean
    path: string
  }
  config: {
    visible: boolean
    path: string
  }
  modpack: {
    name: string
    version: string
  }
}

export const useButtonsSettings = () => {
  return useQuery({
    queryKey: ['buttonsSettings'],
    queryFn: async (): Promise<ButtonsSettings> => {
      const response = await fetch('/api/settings/buttons')
      if (!response.ok) {
        throw new Error('Failed to fetch buttons settings')
      }
      return (await response.json()) as ButtonsSettings
    },
    staleTime: 30000, // 30 secondi
    refetchInterval: 60000, // Aggiorna ogni minuto
  })
}
