import type { PageCapture } from './types'

function domainOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/**
 * Capture the active tab: a JPEG screenshot of the visible area plus its URL,
 * title, favicon and derived metadata. Runs from the popup, which holds the
 * activeTab grant from the toolbar click.
 */
export async function captureActiveTab(): Promise<PageCapture> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !tab.url) {
    throw new Error('No active tab to capture.')
  }
  if (/^(chrome|edge|about|moz-extension|chrome-extension):/i.test(tab.url)) {
    throw new Error('This browser page cannot be captured.')
  }

  const screenshotDataUrl = await chrome.tabs.captureVisibleTab(
    tab.windowId,
    { format: 'jpeg', quality: 85 },
  )

  return {
    url: tab.url,
    title: tab.title ?? tab.url,
    favIconUrl: tab.favIconUrl ?? null,
    domain: domainOf(tab.url),
    capturedAt: new Date().toISOString(),
    screenshotDataUrl,
  }
}

/** Convert a data URL (from captureVisibleTab) into a Blob for upload. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}
