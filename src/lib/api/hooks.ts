import { useMemo } from 'react'
import { createApiClient, type ApiClient } from './client'
import { useConfig } from '@/lib/storage/hooks'

/**
 * Memoised API client bound to the configured server URL.
 * Returns null while the config is loading or no server URL is set.
 */
export function useApiClient(): ApiClient | null {
  const { data: config } = useConfig()
  const serverUrl = config?.serverUrl ?? ''
  return useMemo(
    () => (serverUrl ? createApiClient(serverUrl) : null),
    [serverUrl],
  )
}
