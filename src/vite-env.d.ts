/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_AUTH_REDIRECT_URL?: string
  readonly VITE_OAUTH_ALLOWED_ORIGINS?: string
  readonly VITE_OAUTH_ALLOWED_ORIGIN_PATTERNS?: string
  readonly VITE_PUBLIC_APP_URL?: string
  readonly VITE_AUTH_CONFIG_VERSION?: string
  readonly VITE_APP_MODE?: string
  readonly VITE_ENABLE_TEST_MODE?: string
  readonly VITE_MOCK_ENABLED?: string
  readonly VERCEL_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
