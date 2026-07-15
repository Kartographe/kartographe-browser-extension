import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAuthenticated, login, logout } from '@/lib/oauth/flow'
import { useConfig } from '@/lib/storage/hooks'

export const SESSION_QUERY_KEY = ['session'] as const

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: isAuthenticated,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const { data: config } = useConfig()
  return useMutation({
    mutationFn: async () => {
      if (!config?.serverUrl) {
        throw new Error('Set the server URL first.')
      }
      await login(config.serverUrl)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const { data: config } = useConfig()
  return useMutation({
    mutationFn: async () => {
      if (config?.serverUrl) await logout(config.serverUrl)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries()
    },
  })
}
