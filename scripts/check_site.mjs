/* Smoke test for the portfolio. No dependencies, no build step.
     node scripts/check_site.mjs
   Checks, for every page:
     - every local href and src resolves to a file that exists
     - no link points at a directory, which a file:// browser shows as a listing
     - every manifest slug has a page and a card on the home page
     - the sitemap lists every page and nothing that is missing
     - no duplicate element ids
     - every img has alt text
     - every canvas is either labeled or explicitly decorative
     - head carries a title, a description and a canonical URL
   Exit code 1 on any failure. */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://joshua-hsinya-lin.github.io/';
let failures = 0;
let checks = 0;

function fail(msg) { console.log('FAIL  ' + msg); failures++; }
function pass(msg) { checks++; if (process.env.VERBOSE) console.log('ok    ' + msg); }
function read(rel) { return readFileSync(join(ROOT, rel), 'utf8'); }

const pages = ['index.html', 'about/index.html', '404.html', 'projects/index.html'];
for (const d of readdirSync(join(ROOT, 'projects'))) {
  if (existsSync(join(ROOT, 'projects', d, 'index.html'))) pages.push('projects/' + d + '/index.html');
}

/* Manifest slugs, read without executing the file. */
const manifest = read('projects/manifest.js');
const slugs = [...manifest.matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]);
if (slugs.length < 2) fail('manifest: parsed ' + slugs.length + ' slugs, expected the full list');

const home = read('index.html');
for (const slug of slugs) {
  const page = 'projects/' + slug + '/index.html';
  if (!existsSync(join(ROOT, page))) fail('manifest slug "' + slug + '" has no ' + page);
  else pass(slug + ' page exists');
  if (!home.includes('data-slug="' + slug + '"')) fail('manifest slug "' + slug + '" has no card in index.html');
  else pass(slug + ' card in index.html');
  if (!home.includes('href="' + page + '"')) fail('index.html has no link to ' + page);
}
const cardSlugs = [...home.matchAll(/data-slug="([a-z0-9-]+)"/g)].map((m) => m[1]);
for (const s of cardSlugs) {
  if (!slugs.includes(s)) fail('index.html card "' + s + '" is not in the manifest');
}

/* Sitemap covers every page that should be indexed. */
const sitemap = read('sitemap.xml');
for (const p of pages) {
  if (p === '404.html' || p === 'projects/index.html') continue;
  if (!sitemap.includes(BASE + p)) fail('sitemap.xml is missing ' + p);
  else pass('sitemap lists ' + p);
}
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const rel = m[1].replace(BASE, '');
  if (!existsSync(join(ROOT, rel))) fail('sitemap.xml lists ' + rel + ' which does not exist');
}

/* Per page checks. */
for (const p of pages) {
  const html = read(p);
  const dir = dirname(join(ROOT, p));
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '');

  const refs = [...body.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|data:|#)/.test(ref)) continue;
    const clean = decodeURIComponent(ref.replace(/[#?].*$/, ''));
    if (!clean) continue;
    const target = clean.startsWith('/') ? join(ROOT, clean) : resolve(dir, clean);
    if (!existsSync(target)) fail(p + ' -> ' + ref + ' does not exist');
    else if (statSync(target).isDirectory()) fail(p + ' -> ' + ref + ' points at a directory');
    else pass(p + ' -> ' + ref);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(p + ' has duplicate ids: ' + [...new Set(dupes)].join(', '));
  else pass(p + ' ids unique');

  for (const m of body.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(m[0])) fail(p + ' has an img with no alt: ' + m[0].slice(0, 70));
  }
  for (const m of body.matchAll(/<canvas\b[^>]*>/g)) {
    if (!/aria-label=|aria-hidden="true"/.test(m[0])) {
      fail(p + ' has a canvas that is neither labeled nor marked decorative: ' + m[0].slice(0, 70));
    }
  }

  if (!/<title>[^<]{10,}<\/title>/.test(html)) fail(p + ' has no usable title');
  if (p !== '404.html' && p !== 'projects/index.html') {
    if (!/<meta name="description" content="[^"]{40,}">/.test(html)) fail(p + ' has no usable meta description');
    if (!/<link rel="canonical"/.test(html)) fail(p + ' has no canonical URL');
    if (!/<meta property="og:title"/.test(html)) fail(p + ' has no og:title');
  }
  if (!/lang="en"/.test(html)) fail(p + ' has no lang attribute');

  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ld) {
    try { JSON.parse(ld[1]); pass(p + ' JSON-LD parses'); }
    catch (e) { fail(p + ' has JSON-LD that does not parse: ' + e.message); }
  }
}

/* The written spelling the site standardizes on. */
for (const p of pages) {
  const html = read(p);
  if (/résumé|resumé/i.test(html)) fail(p + ' uses an accented spelling of resume');
}

console.log('\npages: ' + pages.length + ', manifest slugs: ' + slugs.length + ', checks passed: ' + checks + ', failures: ' + failures);
process.exit(failures ? 1 : 0);
