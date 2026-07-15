import type { components } from '@/lib/api/schema'

/** RFC 8414 discovery document (subset we use). */
export interface OAuthMetadata {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  registration_endpoint: string
  revocation_endpoint: string
  device_authorization_endpoint?: string
  scopes_supported?: string[]
  code_challenge_methods_supported?: string[]
  grant_types_supported?: string[]
}

/** Token endpoint response (generated from the backend OpenAPI). */
export type OAuthTokenResponse = components['schemas']['OauthTokenResponse']

/** Dynamic client registration response (generated). */
export type OAuthRegistrationResponse =
  components['schemas']['OauthClientRegistrationResponse']

/** Persisted token set with an absolute expiry (ms epoch). */
export interface TokenSet {
  accessToken: string
  refreshToken: string
  tokenType: string
  scope: string
  /** Absolute expiry time in ms since epoch. */
  expiresAt: number
}

export const OAUTH_SCOPES = 'read write'
export const CLIENT_NAME = 'Kartographe Trail'
