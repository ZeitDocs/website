/**
 * Which background a level renders with (CLAS-127) — pure, so it is unit-tested and shared
 * by the banner, the studio and the level-form preview card.
 *
 * Two layers of state decide it, and the order matters for zero regression (CLAS-138):
 *
 *   1. `page_header_style` is the compatibility switch every shipped banner already has.
 *      It is derived exactly the way banner/App.jsx always derived it: an explicit value
 *      wins, otherwise "image if there is an image id, else none". 'none' renders nothing;
 *      'color' is the colour FAMILY; every other value ('image', and the 'upload'/'preset'
 *      the CLAS-63 form stored) is the image family.
 *   2. `page_header_bg_type` (written only by the Banner Studio) picks a renderer WITHIN that
 *      family. It is honoured only when it agrees with the family, so a record can never be
 *      flipped from colour to image (or back) by this field alone. A level without it renders
 *      through the legacy renderer of its family — which is how every existing banner keeps
 *      its exact pixels.
 */

// Background types the studio writes, and the family each belongs to.
export const BG_TYPE_FAMILY = {
  color: 'color',
  gradient: 'color',
  preset: 'image',
  upload: 'image',
};

/** 'none' | 'color' | 'image' — the page_header_style family, derived the legacy way. */
export function headerFamily(level) {
  if (!level) return 'none';
  const style = level.page_header_style ?? (level.page_header_image_id ? 'image' : 'none');
  if (style === 'none') return 'none';
  return style === 'color' ? 'color' : 'image';
}

/**
 * The renderer key for a level, or null when the level shows no banner.
 *
 * Legacy levels resolve to 'color' or 'legacy-image'. 'legacy-image' is the contain-over-blur
 * treatment every image banner has today; the studio's 'preset'/'upload' types render with a
 * focal point instead (CLAS-132) and are never inferred for a level that lacks the field.
 */
export function resolveBackgroundType(level) {
  const family = headerFamily(level);
  if (family === 'none') return null;
  const declared = level.page_header_bg_type;
  if (declared && BG_TYPE_FAMILY[declared] === family) return declared;
  return family === 'color' ? 'color' : 'legacy-image';
}

/** The `page_header_style` value a background type is stored with (CLAS-131). */
export const styleForBgType = (type) => (BG_TYPE_FAMILY[type] === 'image' ? 'image' : 'color');

// ── Colour and gradient (CLAS-131, tint CLAS-136) ─────────────────────────────────────────

export const FALLBACK_COLOR = '#6B778C';
const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Mix a hex colour towards black (amount < 0) or white (amount > 0), amount in -1…1. */
export function shade(hex, amount) {
  if (!HEX6.test(hex ?? '')) return hex;
  const target = amount < 0 ? 0 : 255;
  const t = Math.min(Math.abs(amount), 1);
  const ch = (i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + target * t);
  return `#${[1, 3, 5].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
}

// The tinted gradient runs from a darkened level colour to the level colour itself.
export const TINT_DARKEN = -0.35;
export const DEFAULT_GRADIENT_ANGLE = 90;

/** The solid band colour: a custom colour unless tinted, else the level's own colour. */
export function bandColor(level) {
  if (!level?.page_header_bg_tint && HEX6.test(level?.page_header_bg_color ?? '')) return level.page_header_bg_color;
  return level?.color_indicator ?? FALLBACK_COLOR;
}

/** `{ from, to, angle }` the gradient renders with, tint and defaults applied. */
export function resolvedGradient(level) {
  const base = level?.color_indicator ?? FALLBACK_COLOR;
  const g = level?.page_header_gradient;
  const angle = Number.isFinite(g?.angle) ? g.angle : DEFAULT_GRADIENT_ANGLE;
  // The stops go straight into a CSS value, so anything that is not a plain hex colour is
  // ignored rather than trusted — validateLevel rejects it on write, this guards the read.
  if (level?.page_header_bg_tint || !HEX6.test(g?.from ?? '') || !HEX6.test(g?.to ?? '')) {
    return { from: shade(base, TINT_DARKEN), to: base, angle };
  }
  return { from: g.from, to: g.to, angle };
}

/** CSS for a gradient band. Rendered as CSS, so a gradient never stores an image. */
export function gradientCss(level) {
  const { from, to, angle } = resolvedGradient(level);
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}

// ── Focal point and zoom (CLAS-132) ───────────────────────────────────────────────────────

const clampPct = (n, d) => (Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : d);

/** `{ x, y, zoom }` for a studio image, defaults applied and out-of-range values clamped. */
export function resolvedFraming(level) {
  const f = level?.page_header_focal;
  const z = level?.page_header_zoom;
  return {
    x: clampPct(f?.x, 50),
    y: clampPct(f?.y, 50),
    zoom: Number.isFinite(z) ? Math.min(Math.max(z, 100), 250) : 100,
  };
}

/**
 * Inline style for a cover-fitted image framed on its focal point. The zoom scales about the
 * focal point itself, so zooming in keeps the subject where the admin put it; `cover`
 * guarantees there is never an empty edge at any band size or width.
 */
export function framingStyle(level, imageSrc) {
  const { x, y, zoom } = resolvedFraming(level);
  const style = {
    backgroundImage: `url(${imageSrc})`,
    backgroundPosition: `${x}% ${y}%`,
  };
  if (zoom !== 100) {
    style.transform = `scale(${zoom / 100})`;
    style.transformOrigin = `${x}% ${y}%`;
  }
  return style;
}
