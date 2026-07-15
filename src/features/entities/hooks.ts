import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiClient } from '@/lib/api/client'
import { useApiClient } from '@/lib/api/hooks'
import { useConfig } from '@/lib/storage/hooks'
import { useSession } from '@/features/auth/hooks'

export interface EntityRef {
  id: string
  title: string
}

function filterByTitle<T extends { title: string }>(items: T[], q: string): T[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return items
  return items.filter((i) => i.title.toLowerCase().includes(needle))
}

// --- Applications --------------------------------------------------------

async function listApplications(client: ApiClient, accountId: string) {
  const { data, error } = await client.GET(
    '/v1/accounts/{account_id}/applications',
    { params: { path: { account_id: accountId }, query: { limit: 100 } } },
  )
  if (error) throw new Error('Failed to load applications')
  return data.items
}

async function listServices(client: ApiClient, accountId: string) {
  const { data, error } = await client.GET('/v1/accounts/{account_id}/services', {
    params: { path: { account_id: accountId }, query: { limit: 100 } },
  })
  if (error) throw new Error('Failed to load services')
  return data.items
}

function useReady() {
  const client = useApiClient()
  const { data: config } = useConfig()
  const { data: authenticated } = useSession()
  const accountId = config?.accountId ?? null
  return {
    client,
    accountId,
    enabled: !!client && !!accountId && authenticated === true,
  }
}

export function useApplications(search: string) {
  const { client, accountId, enabled } = useReady()
  return useQuery({
    queryKey: ['applications', accountId],
    queryFn: () => listApplications(client!, accountId!),
    enabled,
    select: (items) => filterByTitle(items, search),
  })
}

export function useServices(search: string) {
  const { client, accountId, enabled } = useReady()
  return useQuery({
    queryKey: ['services', accountId],
    queryFn: () => listServices(client!, accountId!),
    enabled,
    select: (items) => filterByTitle(items, search),
  })
}

export function useCreateApplication() {
  const { client, accountId } = useReady()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (title: string): Promise<EntityRef> => {
      if (!client || !accountId) throw new Error('Not ready')
      const { data, error } = await client.POST(
        '/v1/accounts/{account_id}/applications',
        {
          params: { path: { account_id: accountId } },
          body: { title, type: 'other' },
        },
      )
      if (error || !data) throw new Error('Failed to create application')
      return { id: data.item.id, title: data.item.title }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications', accountId] })
    },
  })
}

export function useCreateService() {
  const { client, accountId } = useReady()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { title: string; url?: string }): Promise<EntityRef> => {
      if (!client || !accountId) throw new Error('Not ready')
      const { data, error } = await client.POST(
        '/v1/accounts/{account_id}/services',
        {
          params: { path: { account_id: accountId } },
          body: {
            title: input.title,
            type: 'external',
            ...(input.url ? { url: input.url } : {}),
          },
        },
      )
      if (error || !data) throw new Error('Failed to create service')
      return { id: data.item.id, title: data.item.title }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services', accountId] })
    },
  })
}
