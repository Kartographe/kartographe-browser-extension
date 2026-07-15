import i18n from '@/i18n'
import { ensureCapturePermission } from '@/lib/permissions'
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
  // Request host access first, during the user gesture (side panel has no
  // activeTab grant on the browsed tab).
  const granted = await ensureCapturePermission()
  if (!granted) {
    throw new Error(i18n.t('errors.captureDenied'))
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !tab.url) {
    throw new Error(i18n.t('errors.noActiveTab'))
  }
  if (/^(chrome|edge|about|moz-extension|chrome-extension):/i.test(tab.url)) {
    throw new Error(i18n.t('errors.browserPage'))
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
