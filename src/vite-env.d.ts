/// <reference types="vite/client" />
/// <reference types="chrome" />

interface ImportMetaEnv {
  /** Backend base URL default (build-time / type generation). */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
