# Kartographe Trail

**Kartographe Trail** is the official browser extension (web clipper) for
[Kartographe](https://kartographe.app), the open-source, self-hostable
information-system / product mapping platform.

While you browse an application, capture what you see — a screenshot of the
current tab, its URL, title and metadata, or a whole **journey** (an ordered
sequence of steps) — and push it straight into your Kartographe map. Captures can
be attached to an existing application, service or journey, or create a new one.

- **Manifest V3** — Chrome & Firefox from a single, parameterable build.
- **Vite + React 19 + TypeScript (strict)**, pnpm.
- **Typed API client generated from the backend OpenAPI** (`openapi-typescript` +
  `openapi-fetch`) — API types are never written by hand.
- **OAuth (authorization code + PKCE)** public client via
  `chrome.identity.launchWebAuthFlow`, with automatic token refresh and revoke on
  logout. No client secret is embedded.

> Status: MVP complete — OAuth sign-in, single-page capture, attach/create
> application·service, and multi-page journey recording all shipped. See the
> roadmap at the bottom.

## Requirements

- Node.js ≥ 20
- pnpm ≥ 9
- A reachable Kartographe backend (for type generation and at runtime)

## Getting started

```bash
pnpm install

# 1. Point the type generator at your backend (build-time only).
cp .env.example .env
# edit VITE_API_URL if your backend is not on http://localhost:8000

# 2. Generate the typed API client from the live OpenAPI (committed output).
pnpm api:sync

# 3. Run the dev build (HMR).
pnpm dev
```

### Load the unpacked extension

**Chrome / Edge**

1. `pnpm build` (or `pnpm dev` for HMR) → output in `dist/`.
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select the `dist/` folder.

**Firefox**

- `pnpm dev:firefox` launches a dedicated Firefox with the add-on loaded and
  auto-reloads on change (via `web-ext`), or
- `pnpm build:firefox` then `about:debugging#/runtime/this-firefox` → **Load
  Temporary Add-on…** → select `dist/manifest.json`.

### Live testing without reinstalling

`pnpm dev` (Chrome) writes a dev build to `dist/` — load it **once** as an
unpacked extension and keep the dev server running. crxjs then hot-reloads the
popup/options (React HMR) and auto-reloads the extension when you edit the
background or content scripts. You only touch the **↻ Reload** button (never
"Remove") after changing `manifest.config.ts`. `chrome.storage.local` persists
across reloads, so your sign-in and config survive.

### Stable extension id (OAuth)

The Chrome manifest pins a public `key`, so the extension id is always
**`gboflclmaeihplmhhbfmljhfnlbmagkg`** and the OAuth redirect URI stays
**`https://gboflclmaeihplmhhbfmljhfnlbmagkg.chromiumapp.org/`** across reinstalls
— no need to re-register the OAuth client. (The matching private key is not
needed and is not stored in the repo.)

## Configuration

The **runtime** Kartographe server URL is entered by the user in the extension's
**Options** page (Chrome: right-click the toolbar icon → *Options*), and stored in
`chrome.storage.local`. `VITE_API_URL` in `.env` is only the build-time default
used to generate types with `pnpm api:sync`.

## Environment variables

| Variable       | Used at     | Purpose                                                         |
| -------------- | ----------- | -------------------------------------------------------------- |
| `VITE_API_URL` | build / sync | Backend base URL fetched by `pnpm api:sync` (`/openapi.json`). |

## Scripts

| Script              | Description                                            |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev`          | Vite dev server with HMR + auto-reload (Chrome MV3).  |
| `pnpm dev:firefox`  | Build (watch) + `web-ext run` with auto-reload (Firefox). |
| `pnpm build`        | Type-check + production build (Chrome) → `dist/`.     |
| `pnpm build:firefox`| Type-check + production build (Firefox) → `dist/`.    |
| `pnpm typecheck`    | `tsc --noEmit`.                                        |
| `pnpm package`      | Build + zip Chrome & Firefox into `releases/`.        |
| `pnpm api:sync`     | Regenerate `src/lib/api/schema.d.ts` from OpenAPI.    |

## Packaging & release

`pnpm package` type-checks, builds both targets and writes store-ready zips
(`manifest.json` at the zip root) to `releases/`:

```
releases/kartographe-trail-chrome-v<version>.zip    # Chrome Web Store / Edge
releases/kartographe-trail-firefox-v<version>.zip   # Firefox AMO
```

Pushing a version tag runs the **Release** GitHub Actions workflow
(`.github/workflows/release.yml`): it packages both zips, attaches them to a
GitHub Release and keeps them as workflow artifacts.

```bash
# bump "version" in package.json first, then:
git tag v0.1.0 && git push github v0.1.0   # (or your release remote)
```

Store submission itself is manual (upload the zip to the Chrome Web Store /
AMO); automated store publishing would need developer API credentials as repo
secrets and is not wired up.

## Project layout

```
src/
  app/          Shared React providers (TanStack Query, Ant Design)
  background/   MV3 service worker (OAuth, refresh, tab capture)
  content/      Content script (page metadata, journey overlay)
  popup/        Toolbar popup UI (capture, attach, push)
  options/      Settings page (server URL, account, sign-in/out)
  lib/
    api/        openapi-fetch client + generated schema.d.ts (committed)
    oauth/      PKCE, discovery, dynamic registration, token store
    storage/    Typed chrome.storage.local wrappers
  shared/       Cross-context types & messaging
public/icons/   Extension icons
```

## Security

- Public OAuth client (**PKCE**) — no client secret in the code.
- Tokens live only in `chrome.storage.local`; logout revokes them via
  `/oauth/revoke`.
- Minimal MV3 permissions (`activeTab`, `scripting`, `storage`, `identity`,
  `tabs`); host access to the Kartographe server is requested at runtime.

## Roadmap

1. ✅ Scaffold (MV3 + Vite + React + TS).
2. ✅ Typed API client from OpenAPI (`api:sync`).
3. ✅ OAuth PKCE end-to-end (login / refresh / logout).
4. ✅ Single-page capture (screenshot + URL → API).
5. ✅ Attach / create application, service, journey.
6. ✅ Multi-step journey recording.

### How captures map to the API

Screenshots can only be persisted as journey **step files**, so every capture is
stored as a journey:

- **Single page** → a one-step journey (journey → scenario → step → screenshot).
  URL, metadata and annotation are stored in the step parameters.
- **Journey** → one journey → one scenario → N ordered steps, each with its
  screenshot; the recording is buffered in `chrome.storage.local` and survives
  navigation and popup closes until you send or discard it.
- **Attach to application/service** → the selected (or inline-created) entity id
  is recorded on the step parameters; the screenshot stays on the journey step.

## License

[Apache-2.0](./LICENSE) — aligned with the main Kartographe repository.
