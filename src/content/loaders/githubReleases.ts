import type { Loader } from 'astro/loaders';
import { marked } from 'marked';
import { products } from '../../config/products';

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string;
  html_url: string;
}

/**
 * Astro Content Layer loader that pulls GitHub Releases for every product in
 * `products` at build time and stores one entry per published release.
 *
 * Auth: uses RELEASES_TOKEN (fine-grained PAT with `contents: read` on the app
 * repos) if present, falling back to GITHUB_TOKEN. Without a token, private
 * repos return nothing and the page renders an empty state — so local dev still
 * builds. A failed fetch is logged as a warning and never fails the build.
 */
export function githubReleasesLoader(): Loader {
  return {
    name: 'github-releases',
    load: async ({ store, logger, parseData }) => {
      store.clear();

      const token = process.env.RELEASES_TOKEN ?? process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      for (const product of products) {
        const releases: GitHubRelease[] = [];

        try {
          for (let page = 1; ; page++) {
            const res = await fetch(
              `https://api.github.com/repos/${product.repo}/releases?per_page=100&page=${page}`,
              { headers },
            );

            if (!res.ok) {
              logger.warn(
                `Could not fetch releases for ${product.repo}: ${res.status} ${res.statusText}` +
                  (token ? '' : ' (no RELEASES_TOKEN set — private repos return 404)'),
              );
              break;
            }

            const batch = (await res.json()) as GitHubRelease[];
            releases.push(...batch);
            if (batch.length < 100) break;
          }
        } catch (error) {
          logger.warn(`Error fetching releases for ${product.repo}: ${String(error)}`);
        }

        let count = 0;
        for (const release of releases) {
          if (release.draft) continue;

          const id = `${product.slug}/${release.tag_name}`;
          const bodyMarkdown = release.body?.trim() || '_No release notes provided._';

          const data = await parseData({
            id,
            data: {
              product: product.slug,
              productName: product.name,
              tag: release.tag_name,
              name: release.name?.trim() || release.tag_name,
              date: release.published_at ?? release.created_at,
              prerelease: release.prerelease,
              url: release.html_url,
              html: await marked.parse(bodyMarkdown),
            },
          });

          store.set({ id, data });
          count++;
        }

        logger.info(`Loaded ${count} release(s) for ${product.name} (${product.repo}).`);
      }
    },
  };
}
