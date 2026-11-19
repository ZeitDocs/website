/**
 * WCAG text contrast for the banner (CLAS-134). Pure maths; advisory only — it never blocks
 * Apply.
 *
 * The description is small text, so the bar is 4.5:1. The background the text sits on is
 * ESTIMATED: the band colour, both gradient stops (worst case), a preset's measured base
 * colour, or the sampled region of an upload — and, for image backgrounds, with the scrim
 * blended over it first, because that is what the eye actually sees.
 */
import { bandColor, resolvedGradient, resolveBackgroundType } from './background.js';
import { DARK_TEXT, parseAnchor } from './bannerText.js';
import { backgroundRenderers } from './backgroundRenderers.jsx';

export const AA_SMALL_TEXT = 4.5;

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** WCAG 2.x relative luminance of an sRGB colour. */
export function relativeLuminance({ r, g, b }) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** `top` at `alpha` composited over `bottom`. */
export const blend = (bottom, top, alpha) => ({
  r: Math.round(top.r * alpha + bottom.r * (1 - alpha)),
  g: Math.round(top.g * alpha + bottom.g * (1 - alpha)),
  b: Math.round(top.b * alpha + bottom.b * (1 - alpha)),
});

export const TONE_COLORS = { light: { r: 255, g: 255, b: 255 }, dark: hexToRgb(DARK_TEXT) };

/**
 * The scrim's effective opacity where the text sits. Flat is uniform; the fades are strong
 * at their origin and fall off, so the mid-point value is used — an estimate that leans
 * conservative rather than flattering.
 */
export function scrimAlpha(level) {
  const opacity = typeof level?.page_header_overlay_opacity === 'number'
    ? Math.min(Math.max(level.page_header_overlay_opacity, 0), 1) : 0.45;
  const style = level?.page_header_overlay_style ?? 'flat';
  return style === 'flat' ? opacity : opacity * 0.55;
}

/**
 * Where the text sits, as image fractions — the region an upload is sampled from. An anchor
 * says it exactly; dragged positions are left-anchored by construction, so the left half.
 */
export function textRegion(level) {
  const a = parseAnchor(level?.page_header_text_anchor);
  const cols = { left: [0, 0.5], center: [0.25, 0.75], right: [0.5, 1] };
  const rows = { start: [0, 0.6], center: [0.2, 0.8], end: [0.4, 1] };
  const [x0, x1] = cols[a?.col ?? 'left'];
  const [y0, y1] = rows[a?.row ?? 'center'];
  return { x0, y0, x1, y1 };
}

/**
 * The colours the text may sit on, before the scrim. `estimates.presetColor` and
 * `estimates.sampledColor` are supplied by the studio (preset manifest / upload sample).
 */
export function backgroundCandidates(level, estimates = {}) {
  const type = resolveBackgroundType(level);
  if (!type) return [];
  if (type === 'color') return [hexToRgb(bandColor(level))].filter(Boolean);
  if (type === 'gradient') {
    const { from, to } = resolvedGradient(level);
    return [hexToRgb(from), hexToRgb(to)].filter(Boolean);
  }
  const hex = type === 'preset' ? (estimates.presetColor ?? estimates.sampledColor) : estimates.sampledColor;
  return [hexToRgb(hex)].filter(Boolean);
}

/**
 * `{ ratio, passes, tone, better }` for the level as drafted, or null when the background
 * cannot be estimated yet (e.g. an upload still being sampled). `better` is the other tone
 * when it does better — what the one-click fix offers.
 */
export function evaluateContrast(level, estimates = {}) {
  const candidates = backgroundCandidates(level, estimates);
  if (!candidates.length) return null;
  const type = resolveBackgroundType(level);
  const withScrim = (tone) => {
    if (!backgroundRenderers[type]?.scrim) return candidates;
    const scrim = tone === 'dark' ? TONE_COLORS.light : { r: 0, g: 0, b: 0 };
    return candidates.map((c) => blend(c, scrim, scrimAlpha({ ...level, page_header_text_tone: tone })));
  };
  const worst = (tone) => Math.min(...withScrim(tone).map((bg) => contrastRatio(TONE_COLORS[tone], bg)));

  const tone = level?.page_header_text_tone === 'dark' ? 'dark' : 'light';
  const other = tone === 'dark' ? 'light' : 'dark';
  const ratio = worst(tone);
  const otherRatio = worst(other);
  return {
    ratio,
    passes: ratio >= AA_SMALL_TEXT,
    tone,
    better: otherRatio > ratio ? { tone: other, ratio: otherRatio } : null,
  };
}

export const formatRatio = (r) => `${(Math.floor(r * 10) / 10).toFixed(1)}:1`;
