import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

// A single, parameterable manifest for Chrome and Firefox.
// `mode` comes from Vite (`vite build --mode firefox`).
export default defineManifest((env) => {
  const isFirefox = env.mode === 'firefox'

  return {
    manifest_version: 3,
    name: 'Kartographe Trail',
    short_name: 'Kartographe Trail',
    description:
      'Capture pages, screenshots and journeys into your Kartographe map.',
    version: pkg.version,

    // Minimal permissions (see README for the rationale of each one).
    permissions: [
      'activeTab', // read the current tab on user gesture
      'scripting', // inject the content collector on demand
      'storage', // persist tokens + config in chrome.storage.local
      'identity', // OAuth via launchWebAuthFlow
      'tabs', // read tab title/url for the capture
    ],

    // The Kartographe backend host is user-configurable, so we request host
    // access at runtime (chrome.permissions.request) rather than embedding a
    // fixed origin here. `<all_urls>` stays optional for the same reason.
    optional_host_permissions: ['*://*/*'],

    action: {
      default_title: 'Kartographe Trail',
      default_popup: 'src/popup/index.html',
      default_icon: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
      },
    },

    options_ui: {
      page: 'src/options/index.html',
      open_in_tab: true,
    },

    background: isFirefox
      ? // Firefox MV3 background is an event page (scripts[]).
        ({ scripts: ['src/background/service-worker.ts'], type: 'module' } as never)
      : { service_worker: 'src/background/service-worker.ts', type: 'module' },

    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['src/content/content-script.ts'],
        run_at: 'document_idle',
      },
    ],

    icons: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },

    // Firefox requires an explicit add-on id for MV3.
    ...(isFirefox
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'kartographe-trail@kartographe.app',
              strict_min_version: '121.0',
            },
          },
        }
      : {}),
  }
})
