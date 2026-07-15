// Background service worker (MV3).
// This milestone only wires the messaging skeleton; OAuth, token refresh and
// tab capture land in the auth/capture milestones.
import type { RuntimeMessage, RuntimeResponse } from '@/shared/messaging'

chrome.runtime.onInstalled.addListener(() => {
  console.info('[Kartographe Trail] service worker installed')
})

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'PING': {
        const response: RuntimeResponse = { type: 'PONG', at: Date.now() }
        sendResponse(response)
        break
      }
      default:
        break
    }
    // Return true only when responding asynchronously.
    return false
  },
)
