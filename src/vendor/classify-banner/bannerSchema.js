/**
 * The banner field schema (CLAS-126) — the ONE declaration of every `page_header_*` field a
 * classification level can carry.
 *
 * Adding a banner field used to mean editing `validateLevel()`, `toPublicLevel()` (where a
 * forgotten field makes the banner silently fall back to its defaults — rule 28), the banner
 * renderer, three hand-synced copies of the font limits (rule 31) and both `LevelForm`
 * copies. Now it is one entry here:
 *
 *   - `validateLevel()` validates every banner field by walking this list, and rejects any
 *     `page_header_*` key that is not declared;
 *   - `toPublicLevel()` passes the entries marked `public: true` to page viewers;
 *   - the static apps import the same file (relative path, no Forge imports here), so the
 *     limits and defaults the banner, the studio and the backend use cannot drift.
 *
 * Plain data and pure functions ONLY — this module is bundled into the backend AND into the
 * Custom UI apps, so it must not import `@forge/*` or anything with side effects.
 *
 * ZERO REGRESSION (CLAS-138). `saveLevels` validates EVERY level in the space on every save,
 * including levels nobody touched. A rule stricter than what an older editor could write
 * would therefore make a whole space unsaveable. Every rule below accepts every value any
 * shipped editor ever stored — hence the legacy `'upload'`/`'preset'` styles and the two
 * `legacy: true` entries. `null` is accepted everywhere as "absent".
 *
 * `default` is what the RENDERER assumes when the field is absent. The backend never writes
 * defaults: a stored level changes only when an admin edits it (CLAS-138, no backfill).
 *
 * `reset: false` (CLAS-135) marks the background's identity — which image, which style, whether
 * its text is baked. "Reset to defaults" restores every OTHER field and leaves these alone,
 * so a reset never deletes the background the admin picked.
 *
 * Entry shape: { key, type, default, public, since, legacy?, ...type options }
 *   type 'enum'   → values
 *   type 'number' → min, max
 *   type 'bool'
 *   type 'string' → maxLength
 *   type 'color'  → #rrggbb
 *   type 'object' → validate(value, key) throws on a bad value
 */

export const BANNER_FIELD_PREFIX = 'page_header_';

const HEX = /^#[0-9a-fA-F]{6}$/;

const finite = (n) => typeof n === 'number' && Number.isFinite(n);

const validatePoint = (point, key, name, { min = -Infinity, max = Infinity } = {}) => {
  if (point === undefined || point === null) return;
  if (typeof point !== 'object' || Array.isArray(point)) throw new Error(`${key}.${name} must be an object`);
  for (const axis of ['x', 'y']) {
    if (!finite(point[axis])) throw new Error(`${key}.${name}.${axis} must be a number`);
    if (point[axis] < min || point[axis] > max) {
      throw new Error(`${key}.${name}.${axis} must be between ${min} and ${max}`);
    }
  }
};

// Dragged positions in the legacy canvas editor's 1200x240 coordinates (CLAS-117). The editor
// clamped while dragging, but the bounds are deliberately loose: an out-of-range stored
// value is clamped by the renderer, and rejecting it here would block the whole space.
const validateTextPositions = (value, key) => {
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error(`${key} must be an object`);
  for (const name of Object.keys(value)) {
    if (name !== 'levelName' && name !== 'description') throw new Error(`${key} has unknown entry ${name}`);
    validatePoint(value[name], key, name);
  }
};

const validateGradient = (value, key) => {
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error(`${key} must be an object`);
  for (const stop of ['from', 'to']) {
    if (typeof value[stop] !== 'string' || !HEX.test(value[stop])) {
      throw new Error(`${key}.${stop} must be a valid hex color`);
    }
  }
  if (!finite(value.angle) || value.angle < 0 || value.angle > 360) {
    throw new Error(`${key}.angle must be a number between 0 and 360`);
  }
  for (const k of Object.keys(value)) {
    if (!['from', 'to', 'angle'].includes(k)) throw new Error(`${key} has unknown entry ${k}`);
  }
};

const validateFocal = (value, key) => {
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error(`${key} must be an object`);
  for (const k of Object.keys(value)) {
    if (k !== 'x' && k !== 'y') throw new Error(`${key} has unknown entry ${k}`);
  }
  for (const axis of ['x', 'y']) {
    if (!finite(value[axis]) || value[axis] < 0 || value[axis] > 100) {
      throw new Error(`${key}.${axis} must be a number between 0 and 100`);
    }
  }
};

export const TEXT_ANCHORS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];
export const BG_TYPES = ['color', 'gradient', 'preset', 'upload'];

export const BANNER_FIELDS = [
  // ── Core (pre-CLAS-117) ──────────────────────────────────────────────────────────────
  // 'upload' and 'preset' are what the CLAS-63 LevelForm actually stored for image banners;
  // the banner treats every value other than 'none'/'color' as an image.
  { key: 'page_header_style', type: 'enum', values: ['none', 'color', 'image', 'upload', 'preset'],
    default: undefined, public: true, since: 'CLAS-38', reset: false },
  // '' is how the legacy editor cleared an image.
  { key: 'page_header_image_id', type: 'string', maxLength: 128,
    default: undefined, public: true, since: 'CLAS-38', reset: false },

  // ── HTML text overlay (CLAS-117) ─────────────────────────────────────────────────────
  // The migration gate (rule 28): absent / not true means the text is baked into the image.
  { key: 'page_header_text_overlay', type: 'bool',
    default: false, public: true, since: 'CLAS-117', reset: false },
  { key: 'page_header_text_positions', type: 'object', validate: validateTextPositions,
    default: { levelName: { x: 40, y: 130 }, description: { x: 40, y: 175 } },
    public: true, since: 'CLAS-117' },
  { key: 'page_header_text_align', type: 'enum', values: ['left', 'center', 'right'],
    default: 'left', public: true, since: 'CLAS-117' },
  { key: 'page_header_text_shadow', type: 'bool',
    default: false, public: true, since: 'CLAS-117' },
  { key: 'page_header_overlay_opacity', type: 'number', min: 0, max: 1,
    default: 0.45, public: true, since: 'CLAS-117' },
  { key: 'page_header_overlay_style', type: 'enum', values: ['flat', 'left', 'bottom'],
    default: 'flat', public: true, since: 'CLAS-117' },

  // ── Text sizes (CLAS-119) ────────────────────────────────────────────────────────────
  // In the 1200x240 authoring-canvas coordinates, NOT rendered pixels (rule 31).
  { key: 'page_header_name_font_size', type: 'number', min: 16, max: 72,
    default: 42, public: true, since: 'CLAS-119' },
  { key: 'page_header_desc_font_size', type: 'number', min: 10, max: 32,
    default: 20, public: true, since: 'CLAS-119' },

  // ── Banner Studio: background (CLAS-131/132/136) ─────────────────────────────────────
  // Written ONLY when an admin changes the background in the studio — never derived into a
  // stored level (CLAS-138). Absent means "render the way this level always rendered".
  // `page_header_style` stays the compatibility switch: colour/gradient are stored with
  // 'color', preset/upload with 'image' (see static/shared/banner/background.js).
  { key: 'page_header_bg_type', type: 'enum', values: BG_TYPES,
    default: undefined, public: true, since: 'CLAS-131', reset: false },
  // A custom band colour; absent = the level's own colour_indicator.
  { key: 'page_header_bg_color', type: 'color',
    default: undefined, public: true, since: 'CLAS-131', reset: false },
  { key: 'page_header_gradient', type: 'object', validate: validateGradient,
    default: undefined, public: true, since: 'CLAS-131', reset: false },
  // Derive the colour/gradient from each level's colour_indicator, so one shared style still
  // shows every level's colour (CLAS-136).
  { key: 'page_header_bg_tint', type: 'bool',
    default: false, public: true, since: 'CLAS-136', reset: false },
  // Which predefined background was picked. Studio-only (selection state and the contrast
  // estimate); the banner renders the stored image and never needs it.
  { key: 'page_header_preset_id', type: 'string', maxLength: 64,
    default: undefined, public: false, since: 'CLAS-132', reset: false },
  // Applied at render time (background-position / scale), so one stored image serves every
  // band size and page width. 0–100 per axis; zoom in percent.
  { key: 'page_header_focal', type: 'object', validate: validateFocal,
    default: { x: 50, y: 50 }, public: true, since: 'CLAS-132' },
  { key: 'page_header_zoom', type: 'number', min: 100, max: 250,
    default: 100, public: true, since: 'CLAS-132' },

  // ── Banner Studio: text (CLAS-133) ───────────────────────────────────────────────────
  // A 3x3 preset. Absent = the dragged page_header_text_positions (or their defaults) keep
  // rendering exactly as before; set = the preset wins.
  { key: 'page_header_text_anchor', type: 'enum', values: TEXT_ANCHORS,
    default: undefined, public: true, since: 'CLAS-133' },
  { key: 'page_header_text_tone', type: 'enum', values: ['light', 'dark'],
    default: 'light', public: true, since: 'CLAS-133' },

  // ── Legacy, tolerated but never read ─────────────────────────────────────────────────
  // Written by the pre-CLAS-63 editors. Kept so a level that still carries them stays
  // saveable; never passed to viewers.
  { key: 'page_header_name', type: 'string', maxLength: 255,
    default: undefined, public: false, since: 'legacy', legacy: true },
  { key: 'page_header_image', type: 'string', maxLength: 2048,
    default: undefined, public: false, since: 'legacy', legacy: true },
];

// Looked up from the live list rather than a Map built at import time, so the tests can prove
// that declaring a field is ALL it takes (CLAS-126). ~20 entries; the cost is nothing.
export const getBannerField = (key) => BANNER_FIELDS.find((f) => f.key === key);

/** Every field passed to page viewers by `toPublicLevel()` (rule 24/28). */
export const publicBannerFields = () => BANNER_FIELDS.filter((f) => f.public).map((f) => f.key);
export const PUBLIC_BANNER_FIELDS = publicBannerFields();

/** Fields "Reset to defaults" restores (CLAS-135). */
export const resettableBannerFields = () => BANNER_FIELDS
  .filter((f) => !f.legacy && f.reset !== false)
  .map((f) => f.key);

/** Renderer defaults, keyed by field. Absent keys have no default. */
export const BANNER_DEFAULTS = Object.fromEntries(
  BANNER_FIELDS.filter((f) => f.default !== undefined).map((f) => [f.key, f.default]),
);

/** `{ name: {min,max,default}, description: {...} }` — the rule 31 limits, from ONE place. */
export const BANNER_FONT_LIMITS = {
  name: (({ min, max, default: d }) => ({ min, max, default: d }))(getBannerField('page_header_name_font_size')),
  description: (({ min, max, default: d }) => ({ min, max, default: d }))(getBannerField('page_header_desc_font_size')),
};

/** Throws a descriptive Error for a bad value of one declared field. `null`/absent is fine. */
export function validateBannerField(field, value) {
  if (value === undefined || value === null) return;
  const { key } = field;
  switch (field.type) {
    case 'enum':
      if (!field.values.includes(value)) throw new Error(`${key} must be one of: ${field.values.join(', ')}`);
      return;
    case 'number':
      if (!finite(value)) throw new Error(`${key} must be a number`);
      if (value < field.min || value > field.max) throw new Error(`${key} must be between ${field.min} and ${field.max}`);
      return;
    case 'bool':
      if (typeof value !== 'boolean') throw new Error(`${key} must be a boolean`);
      return;
    case 'string':
      if (typeof value !== 'string') throw new Error(`${key} must be a string`);
      if (value.length > field.maxLength) throw new Error(`${key} too long`);
      return;
    case 'color':
      if (typeof value !== 'string' || !HEX.test(value)) throw new Error(`${key} must be a valid hex color`);
      return;
    case 'object':
      field.validate(value, key);
      return;
    default:
      throw new Error(`${key} has an unknown schema type ${field.type}`);
  }
}

/**
 * Validates every banner field on a level, and rejects undeclared `page_header_*` keys — a
 * field nobody declared would be stored but never rendered or returned to viewers.
 */
export function validateBannerFields(level) {
  for (const key of Object.keys(level ?? {})) {
    if (!key.startsWith(BANNER_FIELD_PREFIX)) continue;
    const field = getBannerField(key);
    if (!field) throw new Error(`Unknown banner field ${key}`);
    validateBannerField(field, level[key]);
  }
}

/** The public (viewer-safe) banner fields of a level — rule 24 stays enforced by `public`. */
export function pickPublicBannerFields(level) {
  const out = {};
  for (const key of publicBannerFields()) out[key] = level?.[key];
  return out;
}

// Exported for the studio and the tests; the validators above are the only consumers here.
export const _validators = { validateTextPositions, validateGradient, validateFocal, HEX };
