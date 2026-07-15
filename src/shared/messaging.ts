// Typed message contract between popup/options and the background service worker.
// Extended in later milestones (OAuth, capture, journeys).

export type RuntimeMessage =
  | { type: 'PING' }

export type RuntimeResponse =
  | { type: 'PONG'; at: number }

export async function sendMessage(
  message: RuntimeMessage,
): Promise<RuntimeResponse> {
  return chrome.runtime.sendMessage(message)
}
