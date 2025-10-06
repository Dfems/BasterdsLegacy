import { useQuery } from '@tanstack/react-query'

export const useMinecraftVersions = () => {
  return useQuery({
    queryKey: ['modpack', 'mc-versions'],
    queryFn: async (): Promise<string[]> => {
      const r = await fetch('/api/modpack/mc-versions')
      if (!r.ok) throw new Error('Errore caricamento versioni Minecraft')
      const data = (await r.json()) as { ok: boolean; minecraft: string[] }
      return data.minecraft
    },
    staleTime: 1000 * 60 * 30, // 30 minuti
  })
}
