/**
 * Host permissions are requested at runtime because the Kartographe server URL
 * is user-configured (declared as optional_host_permissions in the manifest).
 * Must be called during a user gesture (e.g. the sign-in click).
 */
export async function ensureHostPermission(serverUrl: string): Promise<boolean> {
  const origin = `${new URL(serverUrl).origin}/*`
  if (await chrome.permissions.contains({ origins: [origin] })) return true
  return chrome.permissions.request({ origins: [origin] })
}

/**
 * Host access needed to screenshot arbitrary pages with captureVisibleTab.
 * From the side panel there is no activeTab grant on the browsed tab, so we
 * request broad host access once (on the capture gesture) instead.
 */
export async function ensureCapturePermission(): Promise<boolean> {
  const origins = ['*://*/*']
  if (await chrome.permissions.contains({ origins })) return true
  return chrome.permissions.request({ origins })
}
