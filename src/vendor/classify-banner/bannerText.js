/**
 * Geometry for the banner's HTML text overlay (CLAS-117).
 *
 * The level name and description used to be painted into the stored JPEG by the canvas
 * editor. They are now DOM, rendered on top of a background-only image, which is what lets a
 * long description wrap instead of being clipped (CLAS-114) and what makes the text scale
 * with the band height instead of shrinking with the image (CLAS-116).
 *
 * The maths lives here rather than in App.jsx because this repo has no DOM test harness —
 * anything fiddly belongs in a plain module that can be unit-tested beside the component.
 *
 * The editor authors on a fixed 1200x240 canvas and stores positions and the name font size
 * in THOSE coordinates. The banner renders at the space's configured height (80/160/240),
 * so everything here is expressed as a fraction of the canvas and re-applied to the band.
 */
import { BANNER_FONT_LIMITS } from './bannerSchema.js';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 240;

// A purely proportional scale makes the description ~7px in an 80px band — precisely the
// unreadability this ticket exists to fix. The floors keep small banners legible; they are
// the reason the text can be larger than its canvas proportion at `small`.
export const MIN_NAME_PX = 16;
export const MIN_DESC_PX = 12;

// Defaults and limits come from the banner schema (CLAS-126) — the same declaration the
// backend validates against, so the three hand-synced copies rule 31 used to warn about are
// gone. A value outside the limits is clamped rather than trusted: the record may predate
// the limits, or have been written by an older client.
export const DEFAULT_NAME_FONT_SIZE = BANNER_FONT_LIMITS.name.default;
export const DESC_FONT_SIZE = BANNER_FONT_LIMITS.description.default;
export const FONT_LIMITS = {
  name: { min: BANNER_FONT_LIMITS.name.min, max: BANNER_FONT_LIMITS.name.max },
  description: { min: BANNER_FONT_LIMITS.description.min, max: BANNER_FONT_LIMITS.description.max },
};

const clampFont = (value, fallback, limits) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.max(n, limits.min), limits.max);
};

/** The authored (canvas-space) sizes for a level, defaulted and clamped. */
export const authoredFontSizes = (level) => ({
  name: clampFont(level?.page_header_name_font_size, DEFAULT_NAME_FONT_SIZE, FONT_LIMITS.name),
  description: clampFont(level?.page_header_desc_font_size, DESC_FONT_SIZE, FONT_LIMITS.description),
});
export const DEFAULT_POSITIONS = {
  levelName: { x: 40, y: 130 },
  description: { x: 40, y: 175 },
};

// Must match styles.css, because the fit maths below is what decides how many lines of
// description are allowed to render. If you change one, change the other.
// ── Auto sizing (CLAS-123) ────────────────────────────────────────────────────────────
// The three fixed sizes make the description fit a fixed band. 'auto' inverts that: the band
// grows to the description instead, so nothing is lost. It is bounded at both ends — the
// customer's FIRST complaint in SUP-4 was that the banner is too big, so a short description
// must still give a short band, and a pathological one must not give an endless one.
export const AUTO_MIN_PX = 80;   // a short description still gets a visible band (= 'small')
export const AUTO_MAX_PX = 320;  // beyond 'large'; the cap that stops runaway growth
// Type in auto mode is sized from the medium band: readable without being the large band's
// 42px. The height varies, so it cannot be the reference for its own type size.
export const AUTO_TYPE_REFERENCE = 160;
// Auto trades the fit loop for room — it can afford more lines than a fixed band, and at
// ~13px that is roughly 1200 characters, past any plausible classification description.
export const AUTO_MAX_DESC_LINES = 8;
// Flow layout needs breathing room where the fixed modes used an absolute anchor.
export const AUTO_PADDING_Y = 14;
export const AUTO_PADDING_X = 40;

export const isAutoSize = (size) => size === 'auto';

/**
 * Resolves the space's `headerImageSize` into what the banner should actually render.
 *
 * Fixed sizes keep the absolute-anchored layout, so a dragged position is honoured exactly as
 * before. Auto puts the text in normal flow — the container cannot grow around a block that
 * is absolutely positioned — which means the authored anchor is deliberately NOT applied in
 * auto mode. That is the trade: auto shows all the text, fixed honours the exact placement.
 */
export function resolveBannerLayout(size) {
  if (isAutoSize(size)) {
    return {
      mode: 'auto',
      typeHeight: AUTO_TYPE_REFERENCE,
      minHeight: AUTO_MIN_PX,
      maxHeight: AUTO_MAX_PX,
    };
  }
  const height = FIXED_HEIGHT_PX[size] ?? FIXED_HEIGHT_PX.medium;
  return { mode: 'fixed', typeHeight: height, height };
}

export const FIXED_HEIGHT_PX = { small: 80, medium: 160, large: 240 };

// ── Text anchor and tone (CLAS-133) ──────────────────────────────────────────────────
// A 3x3 preset replaces free dragging in the studio. Absent → the dragged / default
// positions render exactly as they always did; that path is untouched below.
export const ANCHOR_ROWS = { t: 'start', m: 'center', b: 'end' };
export const ANCHOR_COLS = { l: 'left', c: 'center', r: 'right' };
const FLEX = { start: 'flex-start', center: 'center', end: 'flex-end', left: 'flex-start', right: 'flex-end' };

/** `{ row, col }` for a stored anchor ('tl'…'br'), or null when the level has none. */
export function parseAnchor(anchor) {
  if (typeof anchor !== 'string' || anchor.length !== 2) return null;
  const row = ANCHOR_ROWS[anchor[0]];
  const col = ANCHOR_COLS[anchor[1]];
  return row && col ? { row, col } : null;
}

// Horizontal inset of an anchored block: the legacy editor's 40px on the 1200px canvas.
export const ANCHOR_PAD_X = 40 / CANVAS_WIDTH;
// Vertical inset as a share of the band, floored so a small band keeps a margin, and
// reclaimable (relaxAnchor) when the fit loop runs out of font size.
export const ANCHOR_PAD_Y_FRACTION = 0.12;
export const ANCHOR_PAD_Y_MIN = 6;
export const anchorPadY = (bannerHeight, relax = false) => (relax
  ? ANCHOR_PAD_Y_MIN
  : Math.max(ANCHOR_PAD_Y_MIN, Math.round(bannerHeight * ANCHOR_PAD_Y_FRACTION)));

export const DARK_TEXT = '#172B4D';
const DARK_DESC = 'rgba(23,43,77,0.92)';

/**
 * Colour and shadow for the two lines. Light tone (and an absent field) returns exactly the
 * inline styles the banner always produced — white text from the stylesheet, plus the
 * optional shadow — so every existing banner is untouched. Dark tone swaps the colours and
 * turns the shadow into a light halo.
 */
export function toneStyles(level) {
  const shadowOn = !!level?.page_header_text_shadow;
  if (level?.page_header_text_tone === 'dark') {
    const shadow = shadowOn ? '0 1px 6px rgba(255,255,255,0.85)' : '0 1px 2px rgba(255,255,255,0.35)';
    return {
      name: { color: DARK_TEXT, textShadow: shadow },
      description: { color: DARK_DESC, textShadow: shadow },
    };
  }
  const shadow = shadowOn ? { textShadow: '0 2px 6px rgba(0,0,0,0.75)' } : undefined;
  return { name: shadow, description: shadow };
}

/**
 * Styles for auto mode: text in normal flow, so the band grows around it.
 *
 * Deliberately NOT the fit loop. There is nothing to shrink into — the band expands — so auto
 * skips the measurement passes entirely, which also means no pre-paint flicker window and no
 * ResizeObserver. The line cap is the only limit, and it is generous.
 */
export function autoTextStyle(level) {
  const anchor = parseAnchor(level?.page_header_text_anchor);
  const align = anchor ? anchor.col
    : (['left', 'center', 'right'].includes(level?.page_header_text_align) ? level.page_header_text_align : 'left');
  const authored = authoredFontSizes(level);
  const namePx = scaleFont(authored.name, AUTO_TYPE_REFERENCE, MIN_NAME_PX);
  const descPx = scaleFont(authored.description, AUTO_TYPE_REFERENCE, MIN_DESC_PX);
  const tone = toneStyles(level);
  // The line cap has to come from the height cap, not from a constant: now that the
  // description size is the admin's to choose (CLAS-119), a large one multiplied by a fixed
  // 8 lines would sail past AUTO_MAX_PX and be clipped by the wrap's overflow.
  const room = AUTO_MAX_PX - AUTO_PADDING_Y * 2 - namePx * NAME_LINE_HEIGHT
    - Math.round(descPx * GAP_EM);
  const descLines = Math.max(1, Math.min(AUTO_MAX_DESC_LINES, Math.floor(room / (descPx * DESC_LINE_HEIGHT))));
  const container = {
    textAlign: align,
    padding: `${AUTO_PADDING_Y}px ${AUTO_PADDING_X}px`,
    gap: `${Math.round(descPx * GAP_EM)}px`,
  };
  // An anchored block also places itself vertically when the band is taller than the text
  // (the AUTO_MIN_PX floor), and lines its two lines up on the anchor's side.
  if (anchor) {
    container.alignSelf = FLEX[anchor.row];
    container.alignItems = FLEX[anchor.col];
  }
  return {
    container,
    name: { fontSize: `${namePx}px`, ...tone.name },
    description: {
      fontSize: `${descPx}px`,
      WebkitLineClamp: descLines,
      ...tone.description,
    },
    descLines,
  };
}

/**
 * The description as the banner shows it (CLAS-154).
 *
 * `.banner-description` is `white-space: pre-line`, so the line breaks an admin types in the
 * level form's textarea are kept. Leading and trailing blank lines are dropped: under
 * pre-line they would each take a row of a fixed-height band and push real text into the
 * clamp. A description with NO line break is returned untouched — under `white-space:
 * normal` it rendered exactly the same, and rule 33 needs every existing banner unchanged.
 */
export function displayDescription(text) {
  if (typeof text !== 'string' || !text.includes('\n')) return text;
  return text.replace(/\r\n?/g, '\n').replace(/^\s*\n/, '').replace(/\n\s*$/, '');
}

export const NAME_LINE_HEIGHT = 1.1;
export const DESC_LINE_HEIGHT = 1.3;
export const GAP_EM = 0.3;
export const MAX_DESC_LINES = 4;

const pct = (n) => `${Math.round(n * 10000) / 100}%`;
const clampFraction = (n) => Math.min(Math.max(n, 0), 1);

/**
 * Scales a canvas-space font size to the rendered band, never below `floor`.
 */
export const scaleFont = (canvasPx, bannerHeight, floor) =>
  Math.round(Math.max(canvasPx * (bannerHeight / CANVAS_HEIGHT), floor));

// How many measure-and-shrink passes the banner may take before it accepts what it has
// (CLAS-122). Each pass is one pre-paint layout, so this bounds the cost on a path that runs
// for every viewer on every page view. Convergence is normally 1-2 passes: the first step is
// computed analytically from the measured overflow, the rest only correct for re-wrapping.
export const MAX_FIT_STEPS = 4;

// Stop shrinking when a pass buys less than this much — re-wrapping makes the relationship
// between font size and height non-linear, so without it the last passes chase pixels.
export const FIT_EPSILON = 0.02;

/**
 * The next scale to try, given what the text actually measured (CLAS-122).
 *
 * Height is roughly linear in font size for a FIXED line count, so `available / measured` is
 * a good first guess — but shrinking can also re-wrap the text onto fewer lines, which the
 * ratio does not model. Hence: take the analytic step, then measure again.
 *
 * Returns the current scale unchanged when it already fits, when the floor is reached, or
 * when the step is too small to be worth another layout — all of which end the loop.
 */
export function fitScale({ measured, available, scale, minScale }) {
  if (!(measured > 0) || !(available > 0)) return scale;
  if (measured <= available) return scale;
  const next = scale * (available / measured);
  if (next < minScale) return minScale;
  if (scale - next < FIT_EPSILON) return scale;
  return next;
}

/**
 * Inline styles for the overlay: the text block and both lines.
 *
 * @param {object} level          the public level (page_header_* display fields)
 * @param {number} bannerHeight   rendered band height in px
 * @param {object} [options]
 * @param {number} [options.scale=1]        shrink factor from the fit loop (CLAS-122)
 * @param {boolean} [options.relaxClamp]    let the description run to MAX_DESC_LINES instead
 *   of the height-derived clamp. The fit loop MUST set this: the height-derived clamp
 *   guarantees the text fits, so measuring against it would always report "fits" and nothing
 *   would ever shrink. The clamp is the last resort, applied only once shrinking is spent.
 * @param {boolean} [options.relaxAnchor]   reclaim the empty space above the text.
 *   The anchor is a proportional mapping from the 240px editor canvas, so at `small` it
 *   reserves ~29px of an 80px band — 36% of the strip — above a description that is already
 *   at its font floor and therefore cannot shrink. Type size alone buys `small` nothing
 *   (measured: 154 chars before and after); this is what does. Used only once shrinking is
 *   spent, so a band with room to spare keeps the position the admin authored.
 */
export function bannerTextStyle(level, bannerHeight, options = {}) {
  const { scale = 1, relaxClamp = false, relaxAnchor = false } = options;
  // A studio-chosen 3x3 anchor has its own layout; every level without one keeps the
  // positions path below, unchanged (CLAS-138).
  const anchor = parseAnchor(level?.page_header_text_anchor);
  if (anchor) return anchoredTextStyle(level, bannerHeight, anchor, options);
  const align = ['left', 'center', 'right'].includes(level?.page_header_text_align)
    ? level.page_header_text_align
    : 'left';
  const authored = authoredFontSizes(level);
  const nameSize = authored.name;
  const positions = level?.page_header_text_positions ?? DEFAULT_POSITIONS;
  const namePos = positions.levelName ?? DEFAULT_POSITIONS.levelName;

  // fillText anchors on the BASELINE; a DOM block anchors on its top edge. Lifting the
  // anchor by one font size puts the first line's ascender roughly where the baked name was.
  let topPx = clampFraction((namePos.y - nameSize) / CANVAS_HEIGHT) * bannerHeight;
  const xFraction = clampFraction(namePos.x / CANVAS_WIDTH);

  // Natural size first, then the shrink factor — floored, so the fit loop can never trade
  // legibility for fit. `minScale` is exactly the point at which both lines hit their floor.
  const naturalName = scaleFont(nameSize, bannerHeight, MIN_NAME_PX);
  const naturalDesc = scaleFont(authored.description, bannerHeight, MIN_DESC_PX);
  const minScale = Math.min(1, Math.max(MIN_NAME_PX / naturalName, MIN_DESC_PX / naturalDesc));
  const applied = Math.min(Math.max(scale, minScale), 1);
  const namePx = Math.max(Math.round(naturalName * applied), MIN_NAME_PX);
  const descPx = Math.max(Math.round(naturalDesc * applied), MIN_DESC_PX);
  const nameBlock = namePx * NAME_LINE_HEIGHT;
  const gapPx = Math.round(descPx * GAP_EM);
  const descLine = descPx * DESC_LINE_HEIGHT;

  // `.banner-wrap` is overflow:hidden, so anything that does not fit is clipped SILENTLY —
  // the exact failure this ticket exists to remove. Two guards, in order:
  //   1. lift the anchor until at least the name and one line of description fit;
  //   2. allow only as many description lines as the remaining height can actually show.
  // Without them a 3-line clamp overflows an 80px band by ~18px and the text is cut off.
  // Normally the anchor only lifts far enough for one line of description. When the fit loop
  // has run out of font size it asks for the space back entirely, which is the only lever
  // left on a short band.
  const wantedLines = relaxAnchor ? MAX_DESC_LINES : 1;
  const minNeeded = nameBlock + gapPx + descLine * wantedLines;
  topPx = Math.max(0, Math.min(topPx, bannerHeight - minNeeded));
  const available = bannerHeight - topPx - nameBlock - gapPx;
  // relaxClamp is the fit loop asking "how tall does this text really want to be?".
  const descLines = relaxClamp
    ? MAX_DESC_LINES
    : Math.max(1, Math.min(MAX_DESC_LINES, Math.floor(available / descLine)));
  const topFraction = clampFraction(topPx / bannerHeight);

  // Keep a gutter on the far side so wrapped text never touches the edge.
  const GUTTER = 0.04;
  const container = { top: pct(topFraction), textAlign: align };
  if (align === 'left') {
    container.left = pct(xFraction);
    container.maxWidth = pct(clampFraction(1 - xFraction - GUTTER));
  } else if (align === 'right') {
    container.left = pct(xFraction);
    container.transform = 'translateX(-100%)';
    container.maxWidth = pct(clampFraction(xFraction - GUTTER));
  } else {
    container.left = pct(xFraction);
    container.transform = 'translateX(-50%)';
    container.maxWidth = pct(1 - GUTTER * 2);
  }

  const tone = toneStyles(level);

  return {
    container: { ...container, gap: `${gapPx}px` },
    name: { fontSize: `${namePx}px`, ...tone.name },
    description: {
      fontSize: `${descPx}px`,
      // Consumed by the -webkit-line-clamp in styles.css via a custom property.
      // While measuring, the clamp and the hidden overflow must come OFF. `.banner-description`
      // is a -webkit-box with overflow:hidden, so a clamped element reports the CLAMPED
      // height from scrollHeight, not the height the text actually wants — the fit loop would
      // read a 9-line description as 4 lines and under-shrink, or decide it already fits.
      ...(relaxClamp
        ? { display: 'block', WebkitLineClamp: 'unset', overflow: 'visible' }
        : { WebkitLineClamp: descLines }),
      ...tone.description,
    },
    descLines,
    // Fed back into the fit loop (CLAS-122).
    minScale,
    appliedScale: applied,
    atFloor: applied <= minScale,
    // Height the description may occupy before the block overflows the band.
    available,
  };
}

/**
 * Fixed-band layout for a 3x3 anchor (CLAS-133). The block spans the band between a vertical
 * inset top and bottom, and flex places the two lines at the anchor — so "bottom right" stays
 * bottom right however many lines the description wraps to, which a dragged top-left
 * coordinate never could. The fit-loop contract is the positions path's: `available` is the
 * height the description may occupy, and `relaxAnchor` gives the inset back.
 */
function anchoredTextStyle(level, bannerHeight, anchor, { scale = 1, relaxClamp = false, relaxAnchor = false }) {
  const authored = authoredFontSizes(level);
  const naturalName = scaleFont(authored.name, bannerHeight, MIN_NAME_PX);
  const naturalDesc = scaleFont(authored.description, bannerHeight, MIN_DESC_PX);
  const minScale = Math.min(1, Math.max(MIN_NAME_PX / naturalName, MIN_DESC_PX / naturalDesc));
  const applied = Math.min(Math.max(scale, minScale), 1);
  const namePx = Math.max(Math.round(naturalName * applied), MIN_NAME_PX);
  const descPx = Math.max(Math.round(naturalDesc * applied), MIN_DESC_PX);

  const padY = anchorPadY(bannerHeight, relaxAnchor);
  const nameBlock = namePx * NAME_LINE_HEIGHT;
  const gapPx = Math.round(descPx * GAP_EM);
  const descLine = descPx * DESC_LINE_HEIGHT;
  const available = bannerHeight - padY * 2 - nameBlock - gapPx;
  const descLines = relaxClamp
    ? MAX_DESC_LINES
    : Math.max(1, Math.min(MAX_DESC_LINES, Math.floor(available / descLine)));
  const tone = toneStyles(level);
  return {
    container: {
      top: `${padY}px`,
      bottom: `${padY}px`,
      left: pct(ANCHOR_PAD_X),
      right: pct(ANCHOR_PAD_X),
      justifyContent: FLEX[anchor.row],
      alignItems: FLEX[anchor.col],
      textAlign: anchor.col,
      gap: `${gapPx}px`,
    },
    name: { fontSize: `${namePx}px`, ...tone.name },
    description: {
      fontSize: `${descPx}px`,
      ...(relaxClamp
        ? { display: 'block', WebkitLineClamp: 'unset', overflow: 'visible' }
        : { WebkitLineClamp: descLines }),
      ...tone.description,
    },
    descLines,
    minScale,
    appliedScale: applied,
    atFloor: applied <= minScale,
    available,
  };
}

/**
 * The legibility scrim that used to be painted into the JPEG. Moving it into CSS is what
 * makes an opacity change take effect without re-encoding the image — the other half of the
 * stale-bake bug (CLAS-115).
 */
export function scrimStyle(level) {
  const opacity = typeof level?.page_header_overlay_opacity === 'number'
    ? Math.min(Math.max(level.page_header_overlay_opacity, 0), 1)
    : 0.45;
  const style = level?.page_header_overlay_style ?? 'flat';
  // Dark text needs a LIGHT wash to stay legible (CLAS-133). An absent tone is the black
  // scrim every existing banner has.
  const rgb = level?.page_header_text_tone === 'dark' ? '255,255,255' : '0,0,0';
  if (style === 'left') {
    const strong = Math.min(opacity * 1.8, 0.92);
    return { background: `linear-gradient(to right, rgba(${rgb},${strong}) 0%, rgba(${rgb},${opacity * 0.55}) 55%, rgba(${rgb},0.04) 100%)` };
  }
  if (style === 'bottom') {
    const strong = Math.min(opacity * 1.8, 0.92);
    return { background: `linear-gradient(to top, rgba(${rgb},${strong}) 0%, rgba(${rgb},${opacity * 0.55}) 55%, rgba(${rgb},0.04) 100%)` };
  }
  return { background: `rgba(${rgb},${opacity})` };
}

/**
 * Does this level's stored image still have its text painted into the pixels?
 *
 * TRUE for every level authored before CLAS-117, and the reason there is no flag day: those
 * images cannot be un-baked, so the banner must keep rendering them exactly as it always has
 * rather than draw a second copy of the text on top. A level converts the moment an admin
 * re-picks its background, which is the only point at which a clean image can be encoded.
 */
export const hasBakedText = (level) => level?.page_header_text_overlay !== true;
