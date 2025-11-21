/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
  readonly VITE_APP_SUBTITLE?: string
  readonly VITE_APP_ICON?: string
  readonly VITE_API_URL?: string
  readonly VITE_HASH_ROUTER?: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
