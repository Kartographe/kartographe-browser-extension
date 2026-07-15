import createClient, { type Client } from 'openapi-fetch'
import type { paths } from './schema'
import { getConfig } from '@/lib/storage/config'
import { createAuthMiddleware } from './auth-middleware'

export type ApiClient = Client<paths>

/**
 * Build an openapi-fetch client bound to a specific Kartographe server URL,
 * with the Bearer + refresh auth middleware attached.
 */
export function createApiClient(baseUrl: string): ApiClient {
  const client = createClient<paths>({ baseUrl })
  client.use(createAuthMiddleware(baseUrl))
  return client
}

/**
 * Create a client using the server URL configured by the user in Options
 * (falls back to the build-time default).
 */
export async function createConfiguredApiClient(): Promise<ApiClient> {
  const { serverUrl } = await getConfig()
  if (!serverUrl) {
    throw new Error(
      'No Kartographe server URL configured — set it in the extension options.',
    )
  }
  return createApiClient(serverUrl)
}

/**
 * bodySerializer for multipart/form-data uploads (e.g. journey step files).
 * Pass `{ body: { file: blob }, bodySerializer: formDataSerializer }`.
 */
export function formDataSerializer(body: Record<string, unknown>): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue
    if (value instanceof Blob) {
      form.append(key, value)
    } else if (value instanceof File) {
      form.append(key, value, value.name)
    } else {
      form.append(key, String(value))
    }
  }
  return form
}
