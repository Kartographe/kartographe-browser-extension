// Typed wrappers around chrome.storage.local for extension configuration.
// The Kartographe server URL is entered by the user here at runtime; the
// VITE_API_URL build value is only a fallback default.

const CONFIG_KEY = 'kartographe.config'

export interface ExtensionConfig {
  /** Base URL of the Kartographe backend, e.g. https://kartographe.example.com */
  serverUrl: string
  /** Active account id captures are pushed to (chosen after sign-in). */
  accountId: string | null
}

const DEFAULT_CONFIG: ExtensionConfig = {
  serverUrl: import.meta.env.VITE_API_URL ?? '',
  accountId: null,
}

export async function getConfig(): Promise<ExtensionConfig> {
  const stored = await chrome.storage.local.get(CONFIG_KEY)
  const value = stored[CONFIG_KEY] as Partial<ExtensionConfig> | undefined
  return { ...DEFAULT_CONFIG, ...value }
}

export async function setConfig(patch: Partial<ExtensionConfig>): Promise<ExtensionConfig> {
  const next = { ...(await getConfig()), ...patch }
  await chrome.storage.local.set({ [CONFIG_KEY]: next })
  return next
}

/** Normalise a user-entered server URL (trim, strip trailing slash). */
export function normaliseServerUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '')
}
