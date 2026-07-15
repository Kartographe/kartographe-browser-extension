import type { OAuthTokenResponse, TokenSet } from './types'

const TOKENS_KEY = 'kartographe.oauth.tokens'

/** Convert a token endpoint response into a persisted TokenSet. */
export function toTokenSet(res: OAuthTokenResponse): TokenSet {
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    tokenType: res.token_type ?? 'Bearer',
    scope: res.scope,
    expiresAt: Date.now() + res.expires_in * 1000,
  }
}

export async function getStoredTokens(): Promise<TokenSet | null> {
  const stored = await chrome.storage.local.get(TOKENS_KEY)
  return (stored[TOKENS_KEY] as TokenSet | undefined) ?? null
}

export async function setTokens(tokens: TokenSet): Promise<void> {
  await chrome.storage.local.set({ [TOKENS_KEY]: tokens })
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove(TOKENS_KEY)
}

/** True when the access token is expired (or within `skewMs` of expiring). */
export function isExpired(tokens: TokenSet, skewMs = 30_000): boolean {
  return Date.now() >= tokens.expiresAt - skewMs
}
