/*
 * Régénère toutes les icônes à partir des SVG maîtres de design/logo/.
 *
 * Hors du cycle de build : on ne relance ce script que si le logo change.
 * Il demande Playwright, volontairement absent des dépendances du projet
 * pour ne pas alourdir l'installation :
 *
 *   npm i -D playwright && node scripts/generate-icons.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'design/logo');
// Ce que le site sert réellement.
const OUT = resolve(ROOT, 'public');
// Visuels destinés aux magasins : versionnés, mais jamais déployés.
const STORE = resolve(ROOT, 'design/exports');

mkdirSync(STORE, { recursive: true });

/**
 * Rend un SVG en PNG à une taille exacte.
 * `flatten` retire la transparence en peignant un fond : l'icône App Store
 * refuse le canal alpha.
 */
async function render(page, svgFile, size, outFile, { flatten = null } = {}) {
  const svg = readFileSync(`${SRC}/${svgFile}`, 'utf8');
  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden;
      background:${flatten ?? 'transparent'}}
    svg{display:block;width:${size}px;height:${size}px}
  </style></head><body>${svg}</body></html>`;

  // Chromium impose une taille de fenêtre minimale : on rend dans une fenêtre
  // confortable et on découpe la zone utile, dessinée en haut à gauche.
  const vp = Math.max(size, 400);
  await page.setViewportSize({ width: vp, height: vp });
  await page.setContent(html);
  await page.waitForTimeout(60);
  const buf = await page.screenshot({
    omitBackground: !flatten,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  writeFileSync(outFile, buf);
  return buf.length;
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ deviceScaleFactor: 1 });

const jobs = [
  // --- Application web installable ---
  ['idayal-icon.svg', 192, `${OUT}/icon-192.png`, {}],
  ['idayal-icon.svg', 512, `${OUT}/icon-512.png`, {}],
  ['idayal-icon.svg', 512, `${OUT}/icon-512-maskable.png`, {}],
  // iOS remplit toute transparence en noir : on aplatit.
  ['idayal-icon.svg', 180, `${OUT}/apple-touch-icon.png`, { flatten: '#3B7DD8' }],
  ['idayal-icon.svg', 32, `${OUT}/favicon-32.png`, {}],
  // --- Magasins, pour plus tard ---
  ['idayal-icon.svg', 1024, `${STORE}/appstore-1024.png`, { flatten: '#3B7DD8' }],
  ['idayal-icon.svg', 512, `${STORE}/playstore-512.png`, {}],
  ['idayal-icon-dark.svg', 1024, `${STORE}/appstore-dark-1024.png`, {}],
  ['idayal-icon-mono.svg', 1024, `${STORE}/appstore-tinted-1024.png`, {}],
  ['idayal-adaptive-foreground.svg', 432, `${STORE}/android-foreground-432.png`, {}],
  ['idayal-adaptive-background.svg', 432, `${STORE}/android-background-432.png`, {}],
  ['idayal-icon-mono.svg', 432, `${STORE}/android-monochrome-432.png`, {}],
];

for (const [svg, size, out, opts] of jobs) {
  const bytes = await render(page, svg, size, out, opts);
  console.log(`  ${String(size).padStart(4)} px  ${out.replace(ROOT + '/', '')}  (${(bytes / 1024).toFixed(1)} Ko)`);
}

await browser.close();
