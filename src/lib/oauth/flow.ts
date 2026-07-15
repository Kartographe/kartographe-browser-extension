import i18n from '@/i18n'
import { ensureHostPermission } from '@/lib/permissions'
import { fetchMetadata } from './discovery'
import { createPkce } from './pkce'
import { getOrRegisterClient, getRedirectUri } from './register'
import {
  clearTokens,
  getStoredTokens,
  isExpired,
  setTokens,
  toTokenSet,
} from './tokens'
import { OAUTH_SCOPES, type OAuthMetadata, type OAuthTokenResponse } from './types'

/** POST to the token endpoint (application/x-www-form-urlencoded). */
async function postToken(
  tokenEndpoint: string,
  params: Record<string, string>,
): Promise<OAuthTokenResponse> {
  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(params).toString(),
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = ((await res.json()) as { detail?: string }).detail ?? ''
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(`Token request failed (${res.status})${detail ? `: ${detail}` : ''}`)
  }
  return (await res.json()) as OAuthTokenResponse
}

function buildAuthorizeUrl(
  metadata: OAuthMetadata,
  params: {
    clientId: string
    redirectUri: string
    challenge: string
    state: string
  },
): string {
  const url = new URL(metadata.authorization_endpoint)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('code_challenge', params.challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('scope', OAUTH_SCOPES)
  url.searchParams.set('state', params.state)
  return url.toString()
}

/**
 * Full interactive login: discovery → dynamic registration → PKCE →
 * launchWebAuthFlow → authorization-code exchange → persist tokens.
 */
export async function login(serverUrl: string): Promise<void> {
  // Request host access to the (user-configured) server first, during the gesture.
  const granted = await ensureHostPermission(serverUrl)
  if (!granted) {
    throw new Error(i18n.t('errors.hostPermissionDenied'))
  }

  const metadata = await fetchMetadata(serverUrl)
  const clientId = await getOrRegisterClient(serverUrl, metadata)
  const redirectUri = getRedirectUri()
  const { verifier, challenge } = await createPkce()
  const state = crypto.randomUUID()

  const authorizeUrl = buildAuthorizeUrl(metadata, {
    clientId,
    redirectUri,
    challenge,
    state,
  })

  const redirectResponse = await chrome.identity.launchWebAuthFlow({
    url: authorizeUrl,
    interactive: true,
  })
  if (!redirectResponse) {
    throw new Error(i18n.t('errors.authCancelled'))
  }

  const returned = new URL(redirectResponse)
  const error = returned.searchParams.get('error')
  if (error) {
    const desc = returned.searchParams.get('error_description')
    throw new Error(i18n.t('errors.authDenied', { reason: desc ?? error }))
  }
  if (returned.searchParams.get('state') !== state) {
    throw new Error(i18n.t('errors.stateMismatch'))
  }
  const code = returned.searchParams.get('code')
  if (!code) throw new Error(i18n.t('errors.noCode'))

  const token = await postToken(metadata.token_endpoint, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  })
  await setTokens(toTokenSet(token))
}

// Single in-flight refresh shared across concurrent callers in this context.
let refreshInFlight: Promise<string | null> | null = null

async function doRefresh(serverUrl: string): Promise<string | null> {
  const stored = await getStoredTokens()
  if (!stored) return null

  const metadata = await fetchMetadata(serverUrl)
  const clientId = await getOrRegisterClient(serverUrl, metadata)

  try {
    const token = await postToken(metadata.token_endpoint, {
      grant_type: 'refresh_token',
      refresh_token: stored.refreshToken,
      client_id: clientId,
    })
    const next = toTokenSet(token)
    await setTokens(next)
    return next.accessToken
  } catch {
    // Refresh token invalid/expired → force re-login.
    await clearTokens()
    return null
  }
}

/**
 * Return a valid access token, refreshing transparently when expired.
 * Returns null when there is no session or the refresh failed.
 */
export async function getValidAccessToken(
  serverUrl: string,
): Promise<string | null> {
  const stored = await getStoredTokens()
  if (!stored) return null
  if (!isExpired(stored)) return stored.accessToken

  if (!refreshInFlight) {
    refreshInFlight = doRefresh(serverUrl).finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/** Force a refresh (used by the API middleware after a 401). */
export async function forceRefresh(serverUrl: string): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(serverUrl).finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/** Revoke tokens server-side and clear local state. */
export async function logout(serverUrl: string): Promise<void> {
  const stored = await getStoredTokens()
  try {
    if (stored) {
      const metadata = await fetchMetadata(serverUrl)
      const clientId = await getOrRegisterClient(serverUrl, metadata)
      const revoke = (token: string, hint: string) =>
        fetch(metadata.revocation_endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token,
            client_id: clientId,
            token_type_hint: hint,
          }).toString(),
        }).catch(() => undefined)
      await Promise.all([
        revoke(stored.refreshToken, 'refresh_token'),
        revoke(stored.accessToken, 'access_token'),
      ])
    }
  } finally {
    await clearTokens()
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getStoredTokens()) !== null
}
