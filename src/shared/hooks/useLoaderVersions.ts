import { useQuery, useQueryClient } from '@tanstack/react-query'

export type VersionInfo = {
  version: string
  stable: boolean
  recommended?: boolean
  latest?: boolean
}

export const useLoaderVersions = (loader: string | undefined, mcVersion: string | undefined) => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['modpack', 'loader-versions', loader, mcVersion],
    enabled: Boolean(loader && mcVersion),
    queryFn: async (): Promise<VersionInfo[]> => {
      const params = new URLSearchParams({ loader: loader!, mcVersion: mcVersion! })
      const r = await fetch(`/api/modpack/loader-versions?${params.toString()}`)
      if (!r.ok) throw new Error('Errore caricamento versioni loader')
      const data = (await r.json()) as {
        ok: boolean
        versions: VersionInfo[]
      }
      return data.versions
    },
    staleTime: 1000 * 60 * 30,
    // Ottimizzazione: mantieni i dati precedenti evitando flicker tra selezioni
    placeholderData: (old) => old,
    meta: {
      prefetch: (l: string, v: string) =>
        queryClient.prefetchQuery({ queryKey: ['modpack', 'loader-versions', l, v] }),
    },
  })
}
