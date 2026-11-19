import { useId, useMemo, useState } from 'react';
import BannerView from '../../vendor/classify-banner/BannerView.jsx';
import { evaluateContrast, formatRatio } from '../../vendor/classify-banner/contrast.js';
import { PRESET_CATALOG, presetMeta } from '../../vendor/classify-banner/presetCatalog.js';
import './BannerDemo.css';

/**
 * "Try it" (WEB-1): a mock Confluence page whose banner renders through the app's own
 * BannerView — the component the published banner and the Banner Studio both use — so what a
 * visitor builds here is what their pages would show. Only the controls are the website's.
 *
 * Levels and colours come from the app's Enterprise Standard template.
 */
const LEVELS = [
  { id: 'unclassified', level_name: 'Unclassified', color_indicator: '#6B778C', description: 'No sensitivity, safe for anyone' },
  { id: 'internal', level_name: 'Internal', color_indicator: '#0052CC', description: 'Company internal use only' },
  { id: 'confidential', level_name: 'Confidential', color_indicator: '#FF8B00', description: 'Sensitive business data' },
  { id: 'restricted', level_name: 'Restricted', color_indicator: '#DE350B', description: 'Highly sensitive, limited access' },
];

const BACKGROUNDS = [
  { id: 'color', label: 'Colour' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'preset', label: 'Pattern' },
];

const ANCHORS = [
  { id: 'ml', label: 'Left' },
  { id: 'mc', label: 'Centre' },
  { id: 'mr', label: 'Right' },
];

const SIZES = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const presetUrl = (id) => `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}assets/demo/presets/${id}.webp`;

/** A public level record (the toPublicLevel shape BannerView reads) for the current controls. */
function toLevel(base, s) {
  const level = {
    level_name: s.name,
    description: s.description,
    color_indicator: base.color_indicator,
    page_header_text_overlay: true,
    page_header_text_anchor: s.anchor,
    page_header_text_tone: s.tone,
    page_header_bg_type: s.background,
    // The family switch the app stores alongside the background type (background.js).
    page_header_style: s.background === 'preset' ? 'image' : 'color',
  };
  if (s.background === 'preset') return { ...level, page_header_preset_id: s.preset };
  if (s.background === 'color') {
    return s.tint ? { ...level, page_header_bg_tint: true } : { ...level, page_header_bg_color: s.color };
  }
  return s.tint
    ? { ...level, page_header_bg_tint: true }
    : { ...level, page_header_gradient: { from: s.gradientFrom, to: s.gradientTo, angle: 90 } };
}

function Segmented({ label, options, value, onChange }) {
  const id = useId();
  return (
    <fieldset className="demo-field">
      <legend className="demo-label" id={id}>{label}</legend>
      <div className="demo-segmented" role="radiogroup" aria-labelledby={id}>
        {options.map((o) => (
          <label key={o.id} className={value === o.id ? 'is-active' : undefined}>
            <input type="radio" name={id} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function BannerDemo() {
  const [levelId, setLevelId] = useState('internal');
  const base = LEVELS.find((l) => l.id === levelId);
  const [state, setState] = useState({
    name: base.level_name,
    description: base.description,
    background: 'color',
    tint: true,
    color: '#1C3E60',
    gradientFrom: '#1C3E60',
    gradientTo: '#5AA9C8',
    preset: 'blue',
    anchor: 'ml',
    tone: 'light',
    size: 'medium',
  });
  const set = (patch) => setState((s) => ({ ...s, ...patch }));

  const pickLevel = (id) => {
    const next = LEVELS.find((l) => l.id === id);
    setLevelId(id);
    // The level's own name and description, as the app would show them.
    set({ name: next.level_name, description: next.description });
  };

  const level = useMemo(() => toLevel(base, state), [base, state]);
  const imageSrc = state.background === 'preset' ? presetUrl(state.preset) : undefined;
  const contrast = evaluateContrast(level, { presetColor: presetMeta(state.preset)?.baseColor });
  const ids = { name: useId(), desc: useId() };

  return (
    <div className="demo">
      <div className="demo-controls">
        <fieldset className="demo-field">
          <legend className="demo-label">Classification level</legend>
          <div className="demo-levels">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                className="demo-level"
                aria-pressed={levelId === l.id}
                style={{ '--lvl': l.color_indicator }}
                onClick={() => pickLevel(l.id)}
              >
                <i aria-hidden="true" />
                {l.level_name}
              </button>
            ))}
          </div>
        </fieldset>

        <Segmented label="Background" options={BACKGROUNDS} value={state.background} onChange={(v) => set({ background: v })} />

        {state.background !== 'preset' && (
          <div className="demo-field">
            <label className="demo-check">
              <input type="checkbox" checked={state.tint} onChange={(e) => set({ tint: e.target.checked })} />
              Use the level's colour
            </label>
            {!state.tint && state.background === 'color' && (
              <label className="demo-colour">
                <input type="color" value={state.color} onChange={(e) => set({ color: e.target.value })} />
                Band colour
              </label>
            )}
            {!state.tint && state.background === 'gradient' && (
              <div className="demo-row">
                <label className="demo-colour">
                  <input type="color" value={state.gradientFrom} onChange={(e) => set({ gradientFrom: e.target.value })} />
                  From
                </label>
                <label className="demo-colour">
                  <input type="color" value={state.gradientTo} onChange={(e) => set({ gradientTo: e.target.value })} />
                  To
                </label>
              </div>
            )}
          </div>
        )}

        {state.background === 'preset' && (
          <fieldset className="demo-field">
            <legend className="demo-label">Pattern</legend>
            <div className="demo-presets">
              {PRESET_CATALOG.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="demo-preset"
                  aria-pressed={state.preset === p.id}
                  aria-label={p.name}
                  title={p.name}
                  onClick={() => set({ preset: p.id })}
                  style={{ backgroundImage: `url(${presetUrl(`${p.id}-thumb`)})` }}
                />
              ))}
            </div>
          </fieldset>
        )}

        <div className="demo-field">
          <label className="demo-label" htmlFor={ids.name}>Level name</label>
          <input id={ids.name} className="demo-input" value={state.name} maxLength={40} onChange={(e) => set({ name: e.target.value })} />
          <label className="demo-label" htmlFor={ids.desc}>Description</label>
          <textarea id={ids.desc} className="demo-input" rows={2} value={state.description} maxLength={200} onChange={(e) => set({ description: e.target.value })} />
        </div>

        <div className="demo-row demo-row--wrap">
          <Segmented label="Text position" options={ANCHORS} value={state.anchor} onChange={(v) => set({ anchor: v })} />
          <Segmented
            label="Text colour"
            options={[{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]}
            value={state.tone}
            onChange={(v) => set({ tone: v })}
          />
        </div>

        <Segmented label="Banner size" options={SIZES} value={state.size} onChange={(v) => set({ size: v })} />

        {contrast && (
          <p className={`demo-contrast ${contrast.passes ? 'is-ok' : 'is-low'}`} aria-live="polite">
            Contrast {formatRatio(contrast.ratio)}: {contrast.passes ? 'meets WCAG AA for text' : 'below WCAG AA for text'}
            {!contrast.passes && contrast.better && (
              <button type="button" onClick={() => set({ tone: contrast.better.tone })}>
                Use {contrast.better.tone} text
              </button>
            )}
          </p>
        )}
      </div>

      <figure className="demo-page" aria-label={`Preview: a Confluence page classified as ${state.name || base.level_name}`}>
        <div className="demo-chrome" aria-hidden="true">
          <span className="demo-dots"><i /><i /><i /></span>
          <span className="demo-url">yourcompany.atlassian.net/wiki</span>
        </div>
        <div className="demo-crumb" aria-hidden="true">Finance / Planning / Q3 forecast</div>
        <div className="demo-banner">
          <BannerView level={level} size={state.size} imageSrc={imageSrc} />
        </div>
        <div className="demo-body" aria-hidden="true">
          <div className="demo-byline">
            <span className="demo-avatar" />
            <span>Owned by Ana · Updated today</span>
            <span className="demo-chip" style={{ '--lvl': base.color_indicator }}><i />{state.name || base.level_name}</span>
          </div>
          <div className="demo-title">Q3 revenue forecast</div>
          <div className="demo-lines"><i style={{ width: '94%' }} /><i style={{ width: '86%' }} /><i style={{ width: '62%' }} /></div>
        </div>
      </figure>
    </div>
  );
}
