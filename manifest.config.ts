import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

// Public key that pins the Chrome extension ID to a stable value, so the OAuth
// redirect URI (https://<id>.chromiumapp.org/) never changes across reinstalls.
// Extension id: gboflclmaeihplmhhbfmljhfnlbmagkg
// This is a PUBLIC key — safe to commit; Chrome-only (Firefox uses gecko.id).
const CHROME_KEY =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtfXd6gd1a0x4GYGTIYYUMOkxPg3fv3Oj1cmD837kGm0aqjmbp9UDFZw3KQ0ZsJck815S01hI+TaR19ZKFIsUnpgF+w0N9xOO3WBXgH4+FjiBR+RD15itq2BPgbjKyZtbzfILr6HYp6WgbckFxTwR6jonxhtYoij6YxcDBwTcYYrjDzNdhqkzFnOtPzLCD4TfyPEY44xPXX7T9GvFQ0KJ8FYiwTiQcCz6UX6VQpQJlL8Ow2AK2CtPr4NCCETfAyMaq8AcTorL6m7EsqgxIcGYJReaGFtAfCqdXWN50Agt0B49p7n17YjicP3I50ZRqDLaSsWHDmpLRVWdjIqPo4WHzwIDAQAB'

// A single, parameterable manifest for Chrome and Firefox.
// `mode` comes from Vite (`vite build --mode firefox`).
export default defineManifest((env) => {
  const isFirefox = env.mode === 'firefox'
  const SIDEPANEL_PATH = 'src/sidepanel/index.html'

  const iconSet = {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  }

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
      // Right-docked panel (Chrome); Firefox uses sidebar_action below.
      ...(isFirefox ? [] : ['sidePanel']),
    ],

    // Requested at runtime (chrome.permissions.request), never up front:
    // - the user-configured Kartographe server origin (for API + OAuth), and
    // - <all_urls>, required by captureVisibleTab to screenshot arbitrary pages
    //   from the side panel (there is no activeTab grant there).
    optional_host_permissions: ['<all_urls>'],

    // No default_popup: clicking the toolbar icon opens the side panel
    // (Chrome, via setPanelBehavior) or toggles the sidebar (Firefox).
    action: {
      default_title: 'Kartographe Trail',
      default_icon: iconSet,
    },

    // Right-docked panel that stays open while browsing — ideal for recording a
    // journey page by page. Chrome: side_panel; Firefox: sidebar_action.
    ...(isFirefox
      ? {
          sidebar_action: {
            default_title: 'Kartographe Trail',
            default_panel: SIDEPANEL_PATH,
            default_icon: iconSet,
          },
        }
      : { side_panel: { default_path: SIDEPANEL_PATH } }),

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

    // Firefox requires an explicit add-on id for MV3; Chrome uses a fixed key
    // to keep a stable extension id (and OAuth redirect URI).
    ...(isFirefox
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'kartographe-trail@kartographe.app',
              strict_min_version: '121.0',
            },
          },
        }
      : { key: CHROME_KEY }),
  }
})
