import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://www.zeitdocs.com',
  integrations: [
    // Only for the "Try it" banner demo, which renders the app's own React banner component.
    react(),
    starlight({
      plugins: [starlightImageZoom()],
      title: 'Zeitdocs Documentation',
      description: 'Product documentation for Zeitdocs Confluence apps.',
      logo: {
        src: './src/assets/brand/no-background-zeitdocs.png',
        alt: 'Zeitdocs',
      },
      favicon: '/assets/brand/no-background-zeitdocs.png',
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://www.zeitdocs.com/assets/og/zeitdocs-og.png' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      customCss: ['@fontsource-variable/inter', './src/styles/starlight.css'],
      components: {
        Footer: './src/components/starlight/Footer.astro',
        SocialIcons: './src/components/starlight/SocialIcons.astro',
      },
      sidebar: [
        {
          label: 'Classify',
          items: [
            { label: 'Overview', link: '/docs/classify/' },
            { label: 'Getting Started', link: '/docs/classify/getting-started/' },
            { label: 'Classifying a Page', link: '/docs/classify/classifying-a-page/' },
            { label: 'Page Banner', link: '/docs/classify/page-banner/' },
            { label: 'Banner Studio', link: '/docs/classify/banner-studio/' },
            { label: 'Space Settings', link: '/docs/classify/space-settings/' },
            { label: 'Global Templates', link: '/docs/classify/global-templates/' },
            { label: 'Space Access Control', link: '/docs/classify/space-access-control/' },
            { label: 'Classification Report', link: '/docs/classify/classification-report/' },
            { label: 'Compliance Dashboard', link: '/docs/classify/compliance-dashboard/' },
            { label: 'FAQ', link: '/docs/classify/faq/' },
            { label: 'Releases', link: '/docs/classify/releases/' },
          ],
        },
      ],
    }),
  ],
});
