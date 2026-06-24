import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { defineCollection, z } from 'astro:content';
import { githubReleasesLoader } from './loaders/githubReleases';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema(),
  }),
  releases: defineCollection({
    loader: githubReleasesLoader(),
    schema: z.object({
      product: z.string(),
      productName: z.string(),
      tag: z.string(),
      name: z.string(),
      date: z.string(),
      prerelease: z.boolean(),
      url: z.string().url(),
      /** Release notes pre-rendered to HTML at build time. */
      html: z.string(),
    }),
  }),
};
