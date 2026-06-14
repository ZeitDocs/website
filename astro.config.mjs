import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://zeitdocs.com',
  integrations: [
    starlight({
      title: 'Zeitdocs Documentation',
      description: 'Product documentation for Zeitdocs Confluence apps.',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/starlight.css'],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/zeitdocs',
        },
      ],
      sidebar: [
        {
          label: 'Classify',
          items: [
            { label: 'Overview', link: '/docs/classify/' },
            { label: 'Getting Started', link: '/docs/classify/getting-started/' },
            { label: 'Applying a Classification', link: '/docs/classify/applying-a-classification/' },
            { label: 'Managing Classification Levels', link: '/docs/classify/managing-classification-levels/' },
            { label: 'Visual Banners and Page Header Styles', link: '/docs/classify/visual-banners-page-header-styles/' },
            { label: 'Permission Guidance', link: '/docs/classify/permission-guidance/' },
            { label: 'Space-Level Configuration', link: '/docs/classify/space-level-configuration/' },
            { label: 'Global Templates', link: '/docs/classify/global-templates/' },
            { label: 'Use Cases', link: '/docs/classify/use-cases/' },
            { label: 'FAQ', link: '/docs/classify/faq/' },
          ],
        },
      ],
    }),
  ],
});
