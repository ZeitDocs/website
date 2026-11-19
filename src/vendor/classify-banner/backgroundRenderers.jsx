import React from 'react';
import { bandColor, gradientCss, framingStyle } from './background.js';

/**
 * Background renderer registry (CLAS-127).
 *
 * `BannerView` paints a background by looking its type up here rather than branching on it,
 * so a new background type is a new entry — never a new branch in the component. The type
 * is chosen by `resolveBackgroundType()` in background.js.
 *
 * Each entry:
 *   label        shown by the studio's background source switcher
 *   family       'color' | 'image' — the page_header_style family it renders (background.js)
 *   needsImage   the banner must fetch the stored image before it can render anything
 *   scrim        draw the legibility scrim (scrimStyle) between background and text
 *   studio       false for renderers the studio never offers as a choice (legacy ones)
 *   render({ level, imageSrc, auto }) → { className, style, layers }
 *                className/style are merged onto `.banner-wrap`; `layers` render first,
 *                beneath the scrim and the text.
 */
export const backgroundRenderers = {};

export function registerBackground(type, renderer) {
  backgroundRenderers[type] = { type, studio: true, scrim: false, needsImage: false, ...renderer };
}

// ── Colour band ─────────────────────────────────────────────────────────────────────────
// Every colour banner customers have today, and the studio's solid colour. A level without
// page_header_bg_color renders its colour_indicator — pixel-for-pixel what banner/App.jsx
// always rendered.
registerBackground('color', {
  label: 'Colour',
  family: 'color',
  render: ({ level }) => ({
    className: 'banner-wrap--color',
    style: { background: bandColor(level) },
  }),
});

// ── Gradient (CLAS-131) ─────────────────────────────────────────────────────────────────
// CSS only — nothing is stored in KVS for a gradient.
registerBackground('gradient', {
  label: 'Gradient',
  family: 'color',
  render: ({ level }) => ({
    className: 'banner-wrap--color',
    style: { background: gradientCss(level) },
  }),
});

// ── Legacy image (contain over blur) ────────────────────────────────────────────────────
// Every image banner stored before the Banner Studio: the 5:1 stored JPEG is letterboxed
// over a blurred cover copy of itself on a fixed band, and becomes a cover background on an
// Auto band (CLAS-123). Never offered in the studio — a newly picked image renders through
// the focal-point renderer instead — but it stays registered for as long as one level in
// production lacks `page_header_bg_type`, which is forever (no migration, CLAS-138).
registerBackground('legacy-image', {
  label: 'Image',
  family: 'image',
  needsImage: true,
  scrim: true,
  studio: false,
  render: ({ imageSrc, auto }) => {
    if (auto) {
      return {
        style: {
          backgroundImage: `url(${imageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        },
        layers: null,
      };
    }
    return {
      layers: (
        <>
          <div className="banner-bg" style={{ backgroundImage: `url(${imageSrc})` }} />
          <img src={imageSrc} alt="" className="banner-img" />
        </>
      ),
    };
  },
});

// ── Studio images: preset and upload (CLAS-132) ─────────────────────────────────────────
// A cover-fitted image framed on its focal point at render time, so one stored image serves
// every band size and page width. The text is raised above the photo layer: in Auto the text
// is in normal flow, and an unpositioned block would otherwise paint beneath it.
const framedImage = {
  family: 'image',
  needsImage: true,
  scrim: true,
  raiseText: true,
  render: ({ level, imageSrc }) => ({
    layers: <div className="banner-photo" style={framingStyle(level, imageSrc)} />,
  }),
};
registerBackground('preset', { label: 'Preset', ...framedImage });
registerBackground('upload', { label: 'Upload', ...framedImage });

/** The renderers the studio's source switcher offers, in registration order. */
export const studioBackgrounds = () => Object.values(backgroundRenderers).filter((r) => r.studio);
