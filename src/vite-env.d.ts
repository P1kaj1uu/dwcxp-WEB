/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BAIDU_APP_ID: string
  readonly VITE_BAIDU_SECRET_KEY: string
  readonly VITE_OPENAI_BASE_URL: string
  readonly VITE_OPENAI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
