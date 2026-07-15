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
