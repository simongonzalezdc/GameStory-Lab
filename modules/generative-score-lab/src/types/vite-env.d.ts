/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  readonly MODE: 'development' | 'production' | 'test';
  // Add other env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
