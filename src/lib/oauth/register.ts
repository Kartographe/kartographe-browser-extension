import { CLIENT_NAME, type OAuthMetadata, type OAuthRegistrationResponse } from './types'

// Cache of registered client ids, keyed by server URL, in chrome.storage.local.
const CLIENTS_KEY = 'kartographe.oauth.clients'

type ClientCache = Record<string, string>

async function readCache(): Promise<ClientCache> {
  const stored = await chrome.storage.local.get(CLIENTS_KEY)
  return (stored[CLIENTS_KEY] as ClientCache | undefined) ?? {}
}

async function writeCache(cache: ClientCache): Promise<void> {
  await chrome.storage.local.set({ [CLIENTS_KEY]: cache })
}

/** The extension's OAuth redirect URI (https://<ext-id>.chromiumapp.org/). */
export function getRedirectUri(): string {
  return chrome.identity.getRedirectURL()
}

/**
 * Return a client id for `serverUrl`, registering a new public client via
 * dynamic client registration (RFC 7591) on first use and caching the result.
 */
export async function getOrRegisterClient(
  serverUrl: string,
  metadata: OAuthMetadata,
): Promise<string> {
  const cache = await readCache()
  const existing = cache[serverUrl]
  if (existing) return existing

  const res = await fetch(metadata.registration_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_name: CLIENT_NAME,
      redirect_uris: [getRedirectUri()],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    }),
  })

  if (!res.ok) {
    throw new Error(`Client registration failed (${res.status}).`)
  }

  const registration = (await res.json()) as OAuthRegistrationResponse
  cache[serverUrl] = registration.client_id
  await writeCache(cache)
  return registration.client_id
}

/** Forget the cached client for a server (e.g. after a registration error). */
export async function clearClient(serverUrl: string): Promise<void> {
  const cache = await readCache()
  delete cache[serverUrl]
  await writeCache(cache)
}
