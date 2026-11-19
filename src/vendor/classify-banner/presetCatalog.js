/**
 * The predefined backgrounds as DATA (CLAS-132/134): id, name, and the image's measured
 * average colour — what the contrast estimate assumes the text sits on. The image files live
 * with the studio (static/banner-studio/src/presets.js), the only app that shows them; the
 * level-form card needs only this.
 *
 * Adding a preset is a data change: one entry here, one file + import in the studio.
 * `baseColor` is measured from the image, not chosen by eye — re-measure if a file changes.
 */
export const PRESET_CATALOG = [
  { id: 'blue',     name: 'Blue',      baseColor: '#1c3e60' },
  { id: 'gold',     name: 'Gold',      baseColor: '#b88f51' },
  { id: 'green',    name: 'Green',     baseColor: '#1b472c' },
  { id: 'grey',     name: 'Grey',      baseColor: '#324044' },
  { id: 'lightred', name: 'Light Red', baseColor: '#d54937' },
  { id: 'mint',     name: 'Mint',      baseColor: '#a9dcc5' },
  { id: 'orange',   name: 'Orange',    baseColor: '#93340a' },
  { id: 'purple',   name: 'Purple',    baseColor: '#72558c' },
  { id: 'red',      name: 'Red',       baseColor: '#cb5255' },
  { id: 'sky',      name: 'Sky',       baseColor: '#ade5fc' },
  { id: 'wine',     name: 'Wine',      baseColor: '#651916' },
  { id: 'yellow',   name: 'Yellow',    baseColor: '#f7e8ad' },
];

export const presetMeta = (id) => PRESET_CATALOG.find((p) => p.id === id) ?? null;
