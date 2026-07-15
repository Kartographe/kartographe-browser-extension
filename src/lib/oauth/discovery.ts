import type { OAuthMetadata } from './types'

const WELL_KNOWN_PATH = '/.well-known/oauth-authorization-server'

// In-memory cache keyed by server URL (metadata is stable within a session).
const cache = new Map<string, OAuthMetadata>()

/** Fetch (and cache) the OAuth authorization-server metadata for a server. */
export async function fetchMetadata(serverUrl: string): Promise<OAuthMetadata> {
  const cached = cache.get(serverUrl)
  if (cached) return cached

  const res = await fetch(`${serverUrl}${WELL_KNOWN_PATH}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(
      `OAuth discovery failed (${res.status}). Check the server URL.`,
    )
  }
  const metadata = (await res.json()) as OAuthMetadata
  cache.set(serverUrl, metadata)
  return metadata
}
