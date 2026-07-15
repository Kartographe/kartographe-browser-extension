import type { Middleware } from 'openapi-fetch'
import { forceRefresh, getValidAccessToken } from '@/lib/oauth/flow'

const RETRY_HEADER = 'x-krt-retried'

/**
 * openapi-fetch middleware that attaches the Bearer token and transparently
 * refreshes it once on a 401 before retrying the request.
 */
export function createAuthMiddleware(serverUrl: string): Middleware {
  return {
    async onRequest({ request }) {
      const token = await getValidAccessToken(serverUrl)
      if (token) request.headers.set('Authorization', `Bearer ${token}`)
      return request
    },

    async onResponse({ request, response }) {
      if (response.status !== 401 || request.headers.has(RETRY_HEADER)) {
        return response
      }

      const token = await forceRefresh(serverUrl)
      if (!token) return response

      const retried = new Request(request, {
        headers: new Headers(request.headers),
      })
      retried.headers.set('Authorization', `Bearer ${token}`)
      retried.headers.set(RETRY_HEADER, '1')
      return fetch(retried)
    },
  }
}
