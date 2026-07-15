// Typed wrappers around chrome.storage.local for extension configuration.
// The Kartographe server URL is entered by the user here at runtime; the
// VITE_API_URL build value is only a fallback default.

const CONFIG_KEY = 'kartographe.config'

export interface ExtensionConfig {
  /** Base URL of the Kartographe backend, e.g. https://kartographe.example.com */
  serverUrl: string
  /** Active account id captures are pushed to (chosen after sign-in). */
  accountId: string | null
  /** UI language override ('en' | 'fr'); null follows the browser language. */
  language: string | null
}

const DEFAULT_CONFIG: ExtensionConfig = {
  serverUrl: '',
  accountId: null,
  language: null,
}

/** Sentinel value for the "custom server" option in the settings dropdown. */
export const CUSTOM_SERVER = 'custom'

export interface ServerPreset {
  region: string
  url: string
  disabled?: boolean
}

/** Preset Kartographe Cloud endpoints offered in the settings dropdown. */
export const SERVER_PRESETS: ServerPreset[] = [
  { region: 'EU', url: 'https://api.kartographe.eu' },
  { region: 'USA', url: 'https://api.kartographe.com', disabled: true },
]

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
