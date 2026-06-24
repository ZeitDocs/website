export interface Product {
  /** URL/doc slug, e.g. "classify" — matches the docs folder under src/content/docs/docs/. */
  slug: string;
  /** Display name shown in the UI. */
  name: string;
  /** GitHub repository the releases are pulled from, as "owner/name". */
  repo: string;
}

/**
 * Products whose GitHub Releases are surfaced as a per-app changelog.
 * To onboard a new app: add an entry here and a "Releases" sidebar link in
 * astro.config.mjs. Everything else (loader, page) is driven off this list.
 */
export const products: Product[] = [
  { slug: 'classify', name: 'Classify', repo: 'ZeitDocs/Classification' },
];
