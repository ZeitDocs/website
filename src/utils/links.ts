/**
 * External destinations used across the site. Declared once so a URL change is one edit,
 * never a search through every page.
 */
export const MARKETPLACE_CLASSIFY =
  'https://marketplace.atlassian.com/apps/947466132/classify-page-permissions-visual-security-banners?hosting=cloud&tab=overview';

/** The public reviews tab of the Classify listing: the source for every quoted review. */
export const MARKETPLACE_CLASSIFY_REVIEWS =
  'https://marketplace.atlassian.com/apps/947466132/classify-page-permissions-visual-security-banners?hosting=cloud&tab=reviews';

/**
 * The Marketplace listing with UTM tags, so the Marketplace's partner reports show which page
 * and which button a visitor installed from (WEB-1). `placement` names the button, e.g.
 * "home-hero" or "solution-iso-27001".
 */
export function marketplaceUrl(placement: string) {
  const url = new URL(MARKETPLACE_CLASSIFY);
  url.searchParams.set('utm_source', 'zeitdocs.com');
  url.searchParams.set('utm_medium', 'website');
  url.searchParams.set('utm_campaign', 'classify');
  url.searchParams.set('utm_content', placement);
  return url.href;
}

export const SUPPORT_PORTAL = 'https://zeitdocs.atlassian.net/servicedesk/customer/portal/1';
