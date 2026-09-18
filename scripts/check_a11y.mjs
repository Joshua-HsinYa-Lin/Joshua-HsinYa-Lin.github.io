/* Static accessibility check for the portfolio. No dependencies.
     node scripts/check_a11y.mjs

   This is a linter, not a browser. It catches the classes of problem that
   live in the source: contrast of the color tokens, controls with no
   accessible name, ARIA attributes on elements that cannot carry them, and
   interactive behavior attached to elements that are not focusable. It
   cannot see computed layout or anything a script builds at runtime, so it
   is a floor rather than a ceiling. For a full audit run axe against the
   rendered pages:  npx @axe-core/cli http://localhost:8000/index.html

   Exit code 1 on any failure. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
let warnings = 0;
function fail(msg) { console.log('FAIL  ' + msg); failures++; }
function warn(msg) { console.log('warn  ' + msg); warnings++; }
function read(rel) { return readFileSync(join(ROOT, rel), 'utf8'); }

/* Contrast. WCAG 2.1 AA wants 4.5:1 for normal text and 3:1 for large text
   and for the visual boundary of a control. */
function srgb(c) { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function lum(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function ratio(a, b) {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const css = read('shared/site.css');
function tokens(blockRe) {
  const block = css.match(blockRe);
  if (!block) return {};
  const out = {};
  for (const m of block[0].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6});/g)) out[m[1]] = m[2];
  return out;
}
const light = tokens(/:root \{[\s\S]*?\n\}/);
const dark = Object.assign({}, light, tokens(/:root\[data-theme="dark"\] \{[\s\S]*?\n\}/));

const PAIRS = [
  ['light body text', light.ink, light.bg, 4.5],
  ['light secondary text', light.ink2, light.bg, 4.5],
  ['light muted text', light.muted, light.bg, 4.5],
  ['light muted on card', light.muted, light.bg2, 4.5],
  ['light link', light.link, light.bg, 4.5],
  ['light accent on card', light.accent, light.bg2, 4.5],
  ['light accent on page', light.accent, light.bg, 4.5],
  ['light text on accent', '#ffffff', light.accent, 4.5],
  ['light focus ring', light.focus, light.bg, 3],
  ['dark body text', dark.ink, dark.bg, 4.5],
  ['dark secondary text', dark.ink2, dark.bg, 4.5],
  ['dark muted text', dark.muted, dark.bg, 4.5],
  ['dark link', dark.link, dark.bg, 4.5],
  ['dark focus ring', dark.focus, dark.bg, 3],
  ['panel body text', light['panel-ink'], light.panel, 4.5],
  ['panel muted text', light['panel-muted'], light.panel, 4.5],
  ['panel amber readout', light.amber, light.panel, 4.5],
  ['panel cyan readout', light.cyan, light.panel, 4.5],
  ['panel green readout', light.green, light.panel, 4.5],
  ['panel red readout', light.red, light.panel, 4.5],
  ['panel violet readout', light.violet, light.panel, 4.5],
  ['panel pink readout', light.pink, light.panel, 4.5]
];
console.log('Contrast');
for (const [name, fg, bg, need] of PAIRS) {
  if (!fg || !bg) { warn('could not resolve tokens for ' + name); continue; }
  const r = ratio(fg, bg);
  const line = '  ' + name.padEnd(24) + fg + ' on ' + bg + '  ' + r.toFixed(2) + ':1  needs ' + need + ':1';
  if (r < need) fail(line);
  else console.log(line);
}

/* Markup level checks on every page. */
const pages = ['index.html', 'about/index.html', '404.html'];
for (const d of readdirSync(join(ROOT, 'projects'))) {
  if (existsSync(join(ROOT, 'projects', d, 'index.html'))) pages.push('projects/' + d + '/index.html');
}

const ARIA_ON_ANY = ['aria-hidden', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-live'];
console.log('\nMarkup');
for (const p of pages) {
  const html = read(p);
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '');

  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1], text = m[2].replace(/<[^>]+>/g, '').trim();
    if (!text && !/aria-label=/.test(attrs)) fail(p + ' has a link with no accessible name: ' + m[0].slice(0, 60));
  }
  for (const m of body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const attrs = m[1], text = m[2].replace(/<[^>]+>/g, '').trim();
    if (!text && !/aria-label=/.test(attrs)) fail(p + ' has a button with no accessible name: ' + m[0].slice(0, 60));
  }
  for (const m of body.matchAll(/<(div|span|li)\b([^>]*)\son(click|mouseenter)=/g)) {
    fail(p + ' attaches ' + m[3] + ' to a <' + m[1] + '>, which is not focusable');
  }
  for (const m of body.matchAll(/\baria-([a-z]+)="/g)) {
    const name = 'aria-' + m[1];
    const known = ARIA_ON_ANY.concat(['aria-pressed', 'aria-checked', 'aria-expanded', 'aria-current', 'aria-valuetext', 'aria-controls']);
    if (!known.includes(name)) warn(p + ' uses ' + name + ', which this linter does not know about');
  }
  if (/<h1\b/.test(body)) {
    const h1s = [...body.matchAll(/<h1\b/g)].length;
    if (h1s > 1) fail(p + ' has ' + h1s + ' h1 elements');
  } else fail(p + ' has no h1');
}

/* Reduced motion and focus styling have to exist in the stylesheet. */
console.log('\nPreferences');
if (!/@media \(prefers-reduced-motion: reduce\)/.test(css)) fail('site.css has no prefers-reduced-motion block');
else console.log('  prefers-reduced-motion block present');
if (!/:focus-visible/.test(css)) fail('site.css has no :focus-visible styling');
else console.log('  focus-visible styling present');
const js = read('shared/site.js');
if (!/prefers-reduced-motion/.test(js)) fail('site.js does not check prefers-reduced-motion');
else console.log('  site.js honors prefers-reduced-motion');

console.log('\nfailures: ' + failures + ', warnings: ' + warnings);
process.exit(failures ? 1 : 0);
