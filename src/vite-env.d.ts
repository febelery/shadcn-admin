/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
  readonly VITE_APP_ICON?: string
  readonly VITE_API_URL?: string
  readonly VITE_HASH_ROUTER?: boolean
  readonly VITE_OPENROUTER_BASE_URL?: string
  readonly VITE_OPENROUTER_MODEL?: string
  readonly VITE_OPENROUTER_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
