# AGENTS.md

## Project

This repository contains the public website for Zeitdocs and the product documentation for its Confluence apps.

The first product to document is Classify: Page Permissions & Visual Security Banners for Confluence.

## Tech stack

- Use Astro.
- Use Astro Starlight for product documentation.
- Use MDX when a documentation page benefits from richer layout, callouts or visual sections.
- Keep the website static, fast, accessible and easy to maintain.
- Prefer semantic HTML, reusable components and simple CSS variables.
- Do not introduce unnecessary client-side JavaScript.

## Brand

Zeitdocs should feel:

- Professional
- Trustworthy
- Clear
- Enterprise-ready
- Documentation-first
- Governance-oriented
- Calm, precise and modern

Preferred colors:

- Light blue for trust, structure and governance.
- Light orange for action, warmth and classification emphasis.
- White and off-white backgrounds.
- Light gray borders and subtle dividers.

Avoid:

- Dark aggressive compliance visuals.
- Generic AI-style illustrations.
- Cartoonish SaaS visuals.
- Heavy gradients.
- Overly playful typography.

## Visual direction

Follow the style of:

`public/assets/references/zeitdocs-logo-exploration-style-reference.png`

The visual style should use:

- Soft pastel blue and orange.
- Thin line illustrations.
- Modular geometric shapes.
- Documentation and governance metaphors.
- White/off-white canvas.
- Thin separators.
- Card-based layout.
- Subtle shadows.
- Plenty of breathing room.

The logo exploration image contains concepts such as:

- Geometric Z
- Classified page
- Modular metadata
- Document flow and sync
- Trusted control

Use these as design inspiration for the website, product cards, iconography and documentation illustrations.

## Writing style

- Clear business English.
- Short paragraphs.
- Practical examples.
- Admin-oriented wording.
- Avoid marketing exaggeration.
- Avoid unsupported claims.
- Explain features through user value.
- Keep the tone professional and easy to understand for non-native English speakers.

## Documentation rules

- Do not invent features.
- If behavior is unclear, add a TODO comment.
- Mark screenshot locations with:
  `[Screenshot needed: description]`
- Mark GIF locations with:
  `[GIF recommended: description]`
- Mark places where a real-world example would help with:
  `[Example needed: description]`
- Use consistent terminology:
  - classification level
  - visual banner
  - page header style
  - permission guidance
  - space configuration
  - global template
  - Confluence admin
  - page editor
  - page reader

## Product positioning

Classify helps Confluence teams visually classify pages and guide users around permissions and information sensitivity.

Core value:

- Strong visual classification banners.
- Classification levels managed by admins.
- Better governance for sensitive Confluence content.
- Clearer permission guidance.
- Visual classification directly in the page header.

Important differentiator:

Classify is able to visually change the page header/classification area, making classification immediately visible to readers.

## Output expectations

When creating or editing pages:

- Keep navigation consistent.
- Use simple headings.
- Add screenshot placeholders where visual explanation is important.
- Prefer real-world scenarios over abstract descriptions.
- Use accessible alt text for images.
- Keep pages concise but complete.
- Use callouts for important admin notes.
- Keep implementation clean and maintainable.

## Architecture decision

Astro is used for the Zeitdocs company website and product marketing pages.

This includes:

- Home page
- Products page
- Individual product landing pages
- Company/about pages
- Contact/support entry points
- Commercial and positioning content

Astro Starlight is used for product documentation.

This includes:

- Product documentation landing pages
- Getting started guides
- Admin guides
- Configuration guides
- Use cases
- FAQ
- Troubleshooting content

Do not use Starlight for marketing pages unless the page is clearly part of the documentation experience.
Do not use custom marketing layouts for documentation pages unless there is a strong reason.