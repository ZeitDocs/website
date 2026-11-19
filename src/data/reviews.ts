/**
 * Anonymous review quotes from the public Atlassian Marketplace listing (WEB-1).
 *
 * Rules, from the WEB-1 content rules:
 * - Verbatim text only. Shorten only with "…", never reword or fix typos.
 * - No reviewer name, avatar or company, and no detail in the text that identifies them.
 * - Refreshed by hand from MARKETPLACE_CLASSIFY_REVIEWS; `checked` is when the text was copied.
 * - Show 2–3 at most. The band hides itself when this list is empty.
 */
export interface Review {
  text: string;
  /** Month and year the review was posted on the Marketplace. */
  posted: string;
}

export const REVIEWS_CHECKED = '2026-11-19';

export const REVIEWS: Review[] = [
  {
    text: 'Does exactly what it needs to do, and when I had a request for an improvement, the team implemented this almost immediately!',
    posted: 'September 2026',
  },
];
