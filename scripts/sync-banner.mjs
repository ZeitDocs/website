#!/usr/bin/env node
/**
 * Copies the Classify banner component from the app repository into the website, so the
 * live demo renders through the exact code a customer's Confluence page uses (WEB-1).
 *
 *   node scripts/sync-banner.mjs [path-to-Classification-repo]
 *
 * Default source: ../Classification. The files are copied unchanged except for one import
 * path (bannerText.js reaches into the app's src/lib for the banner schema, which is copied
 * next to it here). Never edit the vendored files by hand: change them in the app, then
 * re-run this script. The preset backgrounds are re-encoded as small WebP files for the web.
 */
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const source = resolve(process.argv[2] ?? '../Classification');
const bannerDir = join(source, 'static/shared/banner');
const outDir = resolve('src/vendor/classify-banner');
const presetSrc = join(source, 'static/banner-studio/src/assets/presets');
const presetOut = resolve('public/assets/demo/presets');

if (!existsSync(bannerDir)) {
  console.error(`Banner source not found: ${bannerDir}`);
  process.exit(1);
}

const FILES = [
  'BannerView.jsx',
  'background.js',
  'backgroundRenderers.jsx',
  'bannerText.js',
  'banner.css',
  'contrast.js',
  'presetCatalog.js',
];

mkdirSync(outDir, { recursive: true });
for (const file of FILES) copyFileSync(join(bannerDir, file), join(outDir, file));
copyFileSync(join(source, 'src/lib/bannerSchema.js'), join(outDir, 'bannerSchema.js'));

const textPath = join(outDir, 'bannerText.js');
const text = readFileSync(textPath, 'utf8');
const rewritten = text.replace("'../../../src/lib/bannerSchema.js'", "'./bannerSchema.js'");
if (rewritten === text) {
  console.error('bannerText.js no longer imports ../../../src/lib/bannerSchema.js — update this script.');
  process.exit(1);
}
writeFileSync(textPath, rewritten);

let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: source }).toString().trim();
} catch {
  /* not a git checkout */
}
writeFileSync(
  join(outDir, 'SOURCE.md'),
  `# Vendored from the Classify app\n\n` +
    `Copied by \`scripts/sync-banner.mjs\` from \`ZeitDocs/Classification\` at commit \`${commit}\`.\n\n` +
    `- \`static/shared/banner/\`: ${FILES.join(', ')}\n` +
    `- \`src/lib/bannerSchema.js\` (import path in bannerText.js rewritten to \`./bannerSchema.js\`)\n\n` +
    `Do not edit these files here. Change them in the app and re-run the script.\n`,
);

mkdirSync(presetOut, { recursive: true });
const { PRESET_CATALOG } = await import(`file://${join(outDir, 'presetCatalog.js').replace(/\\/g, '/')}`);
for (const { id } of PRESET_CATALOG) {
  const input = join(presetSrc, `header-theme-${id}.png`);
  await sharp(input).resize({ width: 1200 }).webp({ quality: 72 }).toFile(join(presetOut, `${id}.webp`));
  await sharp(input).resize({ width: 96, height: 40, fit: 'cover' }).webp({ quality: 70 }).toFile(join(presetOut, `${id}-thumb.webp`));
}

console.log(`Synced ${FILES.length + 1} files and ${PRESET_CATALOG.length} presets from ${source} @ ${commit}`);
