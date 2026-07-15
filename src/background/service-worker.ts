// Background service worker (MV3).
// Wires the messaging skeleton and makes the toolbar icon open the right-docked
// panel: the side panel on Chrome, the sidebar on Firefox.
import type { RuntimeMessage, RuntimeResponse } from '@/shared/messaging'

// Chrome: clicking the toolbar icon opens the side panel.
chrome.sidePanel
  ?.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.warn('[Kartographe Trail] sidePanel', error))

// Firefox has no sidePanel API — toggle the sidebar on the action click instead.
if (!chrome.sidePanel && chrome.action?.onClicked) {
  chrome.action.onClicked.addListener(() => {
    const sidebar = (globalThis as { browser?: { sidebarAction?: { toggle?: () => void } } })
      .browser?.sidebarAction
    sidebar?.toggle?.()
  })
}

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
