import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import {
  bannerTextStyle, autoTextStyle, resolveBannerLayout, scrimStyle, hasBakedText,
  fitScale, MAX_FIT_STEPS, displayDescription,
} from './bannerText.js';
import { resolveBackgroundType } from './background.js';
import { backgroundRenderers } from './backgroundRenderers.jsx';
import './banner.css';

/**
 * The banner, as a pure component (CLAS-127).
 *
 * The published banner (static/banner) and the Banner Studio preview both render THROUGH
 * THIS, which is the whole basis of the studio's promise that the preview is what viewers
 * see. It takes data and renders; it never fetches. Any change here changes every customer
 * banner, so run the CLAS-138 visual comparison (static/banner/visual) before shipping one.
 *
 * @param {object}   props.level      the public level (toPublicLevel shape)
 * @param {string}   props.size       the space's headerImageSize ('small'|'medium'|'large'|'auto')
 * @param {string}   [props.imageSrc] a data: URL for image backgrounds; nothing renders
 *                                    until it is present, exactly as the banner always did
 * @param {Function} [props.onDismiss] renders the ✕ button when given
 * @param {Function} [props.onFit]    called with the settled fit ({ scale, relaxAnchor, ... })
 *                                    — how the studio's size cards learn what actually rendered
 */
export default function BannerView({ level, size, imageSrc, onDismiss, onFit }) {
  const type = resolveBackgroundType(level);
  const renderer = type ? backgroundRenderers[type] : null;
  const layout = useMemo(() => resolveBannerLayout(size), [size]);
  const auto = layout.mode === 'auto';
  const bannerHeight = layout.typeHeight;

  // CLAS-117: the text is DOM only for images encoded WITHOUT it. A level authored earlier
  // has the text in its pixels and cannot be un-baked, so it renders untouched — drawing the
  // overlay over it would show everything twice. Colour backgrounds always draw the text.
  const textLevel = !renderer ? null
    : (renderer.family === 'image' && hasBakedText(level) ? null : level);

  // ── Shrink to fit (CLAS-122) ──────────────────────────────────────
  // The band height fixes how much room there is; the description is whatever the admin
  // typed. Rather than budget characters — we cannot know what a customer will write — the
  // banner measures the rendered text and shrinks it until it fits, down to a legibility
  // floor. `fitting` relaxes the line clamp while measuring: the clamp guarantees a fit by
  // construction, so leaving it on would make every measurement report success.
  const textRef = useRef(null);
  const [scale, setScale] = useState(1);
  // Second lever, used only after font size is spent: reclaim the empty space the authored
  // anchor reserves above the text. On an 80px band the description is already at its floor,
  // so this is the only thing that buys it any room at all.
  const [relaxAnchor, setRelaxAnchor] = useState(false);
  const [fitting, setFitting] = useState(true);
  const stepRef = useRef(0);

  const restartFit = () => {
    stepRef.current = 0;
    setScale(1);
    setRelaxAnchor(false);
    setFitting(true);
  };

  // Re-fit from scratch whenever the inputs to the layout change.
  useEffect(() => {
    restartFit();
  }, [textLevel, bannerHeight]);

  // The Confluence content column is fluid, so a window resize re-wraps the description and
  // invalidates the fit. Restart from scale 1 rather than from the current one: a WIDER
  // column needs the text to grow back, which a downward-only loop could never do.
  useEffect(() => {
    const el = textRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let frame = null;
    let last = el.clientWidth;
    const observer = new ResizeObserver(() => {
      // Width only. The observer also fires for the height changes the fit loop itself
      // causes, and reacting to those would restart the loop it just finished — forever.
      const width = el.clientWidth;
      if (width === last) return;
      last = width;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restartFit);
    });
    observer.observe(el);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [textLevel, imageSrc]);

  // useLayoutEffect, not useEffect: this runs after layout but BEFORE paint, so the viewer
  // never sees the text resize. Each pass is one more pre-paint layout, bounded by
  // MAX_FIT_STEPS — this path runs for every viewer on every page view.
  useLayoutEffect(() => {
    const el = textRef.current;
    // Auto mode has nothing to fit into — the band expands — so it skips the measurement
    // passes altogether, and with them the pre-paint hidden window.
    if (!el || !textLevel || !fitting || auto) return;

    const { minScale, available } = bannerTextStyle(textLevel, bannerHeight, {
      scale, relaxAnchor, relaxClamp: true,
    });
    const desc = el.querySelector('.banner-description');
    const measured = desc ? desc.scrollHeight : 0;

    const next = fitScale({ measured, available, scale, minScale });
    const settled = next === scale || stepRef.current >= MAX_FIT_STEPS;

    if (settled && measured > available && !relaxAnchor) {
      // Font size is spent and it still does not fit. Take the anchor's reserved space and
      // measure once more before giving up and clamping.
      stepRef.current += 1;
      setRelaxAnchor(true);
      return;
    }
    // Settled: it fits, both levers are spent, or the remaining step is not worth a layout.
    // Whatever overflow is left is taken by the height-derived clamp.
    if (settled) {
      setFitting(false);
      return;
    }
    stepRef.current += 1;
    setScale(next);
  }, [textLevel, bannerHeight, scale, relaxAnchor, fitting, auto, imageSrc]);

  // Report what actually rendered, once settled, so the studio can say "held at minimum" or
  // "cut off" from the real layout rather than a re-implementation of it.
  // Auto never runs the loop, so it reports straight away. The published banner passes no
  // onFit, so none of this runs for a page viewer.
  useEffect(() => {
    if (!onFit || (fitting && !auto)) return;
    const el = textRef.current;
    const desc = el?.querySelector('.banner-description');
    onFit({
      scale: auto ? 1 : scale,
      relaxAnchor: auto ? false : relaxAnchor,
      clipped: desc ? desc.scrollHeight > desc.clientHeight + 1 : false,
      height: el?.parentElement?.offsetHeight ?? null,
    });
  });

  if (!renderer) return null;
  if (renderer.needsImage && !imageSrc) return null;

  // The name and description are the same DOM for every background — one place where they
  // wrap and scale, rather than a copy per background type that drifts apart.
  const text = textLevel && (() => {
    const s = auto
      ? autoTextStyle(textLevel)
      : bannerTextStyle(textLevel, bannerHeight, { scale, relaxAnchor, relaxClamp: fitting });
    const name = textLevel.level_name;
    const description = displayDescription(textLevel.description);
    if (!name && !description) return null;
    return (
      <div
        ref={textRef}
        className={`banner-text${auto ? ' banner-text--flow' : ''}${auto && renderer.raiseText ? ' banner-text--raised' : ''}`}
        // Hidden only while measuring, and only before the first paint — the fit loop runs in
        // a layout effect, so a viewer never observes this state. Auto never measures.
        style={{ ...s.container, visibility: !auto && fitting ? 'hidden' : 'visible' }}
      >
        {name && <span className="banner-level-name" style={s.name}>{name}</span>}
        {description && <span className="banner-description" style={s.description}>{description}</span>}
      </div>
    );
  })();

  // Fixed bands set an exact height; auto sets bounds and lets the content decide.
  const wrapSize = auto
    ? { minHeight: `${layout.minHeight}px`, maxHeight: `${layout.maxHeight}px` }
    : { height: `${layout.height}px` };

  const bg = renderer.render({ level, imageSrc, auto });
  const className = ['banner-wrap', bg.className, auto ? 'banner-wrap--auto' : null]
    .filter(Boolean).join(' ');

  return (
    <div className={className} style={{ ...wrapSize, ...bg.style }}>
      {bg.layers}
      {/* The legibility scrim used to be painted into the JPEG. As CSS it responds to an
          opacity change without the image being re-encoded (CLAS-115). */}
      {renderer.scrim && textLevel && <div className="banner-scrim" style={scrimStyle(textLevel)} />}
      {text}
      {onDismiss && (
        <button className="banner-close" onClick={onDismiss} aria-label="Dismiss banner">
          ✕
        </button>
      )}
    </div>
  );
}
