// PKCE helpers (RFC 7636) using the WebCrypto API available in MV3 contexts.

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of arr) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

/** A high-entropy, URL-safe random string (used for verifier and state). */
export function randomUrlSafe(byteLength = 32): string {
  return base64UrlEncode(randomBytes(byteLength))
}

export interface Pkce {
  verifier: string
  challenge: string
  method: 'S256'
}

/** Generate a PKCE verifier + S256 challenge pair. */
export async function createPkce(): Promise<Pkce> {
  const verifier = randomUrlSafe(32)
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  return { verifier, challenge: base64UrlEncode(digest), method: 'S256' }
}
