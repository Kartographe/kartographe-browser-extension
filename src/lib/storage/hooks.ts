import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getConfig, setConfig, type ExtensionConfig } from './config'

export const CONFIG_QUERY_KEY = ['config'] as const

export function useConfig() {
  return useQuery({ queryKey: CONFIG_QUERY_KEY, queryFn: getConfig })
}

export function useSaveConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<ExtensionConfig>) => setConfig(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY })
    },
  })
}
