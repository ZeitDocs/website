import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://www.zeitdocs.com',
  integrations: [
    starlight({
      title: 'Zeitdocs Documentation',
      description: 'Product documentation for Zeitdocs Confluence apps.',
      logo: {
        src: './src/assets/brand/zeitdocs-logo.png',
        alt: 'Zeitdocs',
      },
      favicon: '/assets/brand/zeitdocs-logo.png',
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
            { label: 'Classifying a Page', link: '/docs/classify/classifying-a-page/' },
            { label: 'Page Banner', link: '/docs/classify/page-banner/' },
            { label: 'Space Settings', link: '/docs/classify/space-settings/' },
            { label: 'Global Templates', link: '/docs/classify/global-templates/' },
            { label: 'Space Access Control', link: '/docs/classify/space-access-control/' },
            { label: 'Classification Report', link: '/docs/classify/classification-report/' },
            { label: 'FAQ', link: '/docs/classify/faq/' },
          ],
        },
      ],
    }),
  ],
});
