import { useQuery } from '@tanstack/react-query'
import type { ApiClient } from '@/lib/api/client'
import { useApiClient } from '@/lib/api/hooks'
import { useSession } from '@/features/auth/hooks'

async function fetchMe(client: ApiClient) {
  const { data, error } = await client.GET('/me')
  if (error) throw new Error('Failed to load profile')
  return data.item
}

async function fetchAccounts(client: ApiClient) {
  const { data, error } = await client.GET('/v1/accounts', {
    params: { query: { limit: 100 } },
  })
  if (error) throw new Error('Failed to load accounts')
  return data.items
}

export function useMe() {
  const client = useApiClient()
  const { data: authenticated } = useSession()
  return useQuery({
    queryKey: ['me'],
    queryFn: () => fetchMe(client!),
    enabled: !!client && authenticated === true,
  })
}

export function useAccounts() {
  const client = useApiClient()
  const { data: authenticated } = useSession()
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => fetchAccounts(client!),
    enabled: !!client && authenticated === true,
  })
}
