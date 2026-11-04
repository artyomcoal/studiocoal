/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

interface ImportMetaEnv {
  readonly PUBLIC_SANITY_PROJECT_ID: string;
  readonly PUBLIC_SANITY_DATASET: string;
  readonly SANITY_API_READ_TOKEN?: string;
  /** Newsletter sign-up URL (Footer). Receives a form-encoded `email` POST. */
  readonly PUBLIC_NEWSLETTER_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// hls.js ships types for its main entry only; the light build has the same API.
declare module "hls.js/light" {
  export * from "hls.js";
  export { default } from "hls.js";
}
