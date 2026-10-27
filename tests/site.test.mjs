import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { PDFDocument, PDFName } from 'pdf-lib';
import { ROOT, readSources, faqItems, learnerData } from '../scripts/content.mjs';
const dist = path.join(ROOT, 'dist'), base = process.env.BASE_PATH || '/';
const read = p => fs.readFile(path.join(dist, p), 'utf8');
const sessions = await readSources('sessions');
const quotes = JSON.parse(await fs.readFile(path.join(ROOT, 'content/quotes.json'), 'utf8'));
async function walk(dir, prefix = '') { const out = []; for (const item of await fs.readdir(dir, { withFileTypes: true })) { const name = prefix + item.name; if (item.isDirectory()) out.push(...await walk(path.join(dir, item.name), name + '/')); else out.push(name); } return out; }
const files = await walk(dist), htmlFiles = files.filter(f => f.endsWith('.html'));

test('all 24 independent session sources compile to real reading and learner pages', async () => {
  assert.equal(sessions.length, 24);
  assert.equal(new Set(sessions.map(s => s.slug)).size, 24);
  assert.deepEqual(sessions.map(s => s.number).sort((a,b) => a-b), Array.from({length:24},(_,i)=>i+1));
  for (const s of sessions) {
    assert.equal(s.part, Math.ceil(s.number/6));
    assert.equal(faqItems(s).length, 3);
    assert.equal(learnerData(s, quotes).explore.length, 3);
    for (const q of s.quotes) assert.ok(quotes[q]?.url);
    const html = await read(`sessions/${s.slug}/index.html`);
    assert.match(html, /<article class="prose session-prose">/);
    assert.ok(html.includes(s.title.replaceAll('&', '&amp;')));
    assert.ok(html.includes(`learner-sheets/${s.slug}.pdf`));
    assert.ok(html.includes(`markdown/sessions/${s.file}`));
    assert.ok(files.includes(`learner-sheets/${s.slug}/index.html`));
  }
});

test('all 72 original FAQs and every guidance section are preserved', async () => {
  const framework = await fs.readFile(path.join(ROOT, 'content/framework.md'), 'utf8');
  const original = [...framework.matchAll(/\*\*FAQs\.\*\* (.+)/g)].map(m => m[1]);
  assert.equal(original.length, 24);
  for (const s of sessions) {
    const joined = faqItems(s).map(f => `${f.question} ${f.answer}`).join(' ').replace(/\s+/g, ' ');
    assert.equal(joined, original[s.number-1].replace(/\s+/g, ' '), `Session ${s.number} FAQ content changed during import`);
  }
  const guides = await readSources('guidance'); assert.equal(guides.length, 7);
  for (const guide of guides) assert.ok(files.includes(`guidance/${guide.slug}/index.html`));
  assert.equal(Object.keys(quotes).length, 15);
});

test('every local HTML link, download, image and fragment resolves, including subpath deployments', async () => {
  const documents = new Map(await Promise.all(htmlFiles.map(async file => [file, await read(file)])));
  for (const [file, html] of documents) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, `${file}: duplicate IDs`);
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const href = match[1].replaceAll('&amp;', '&');
      const target = new URL(href, `https://example.test${base}${file}`);
      if (target.origin !== 'https://example.test') continue;
      assert.ok(target.pathname.startsWith(base), `${file}: escapes site base ${href}`);
      let relative = decodeURIComponent(target.pathname.slice(base.length));
      if (relative === '' || relative.endsWith('/')) relative += 'index.html';
      assert.ok(files.includes(relative), `${file}: broken link ${href}`);
      if (target.hash && documents.has(relative)) {
        const id = decodeURIComponent(target.hash.slice(1));
        assert.ok(documents.get(relative).includes(`id="${id}"`), `${file}: missing fragment ${href}`);
      }
    }
  }
});

test('documents have semantic reading landmarks and remain readable without JavaScript', async () => {
  for (const file of htmlFiles) {
    const html = await read(file);
    assert.match(html, /<html lang="en-GB">/);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${file}: one H1`);
    assert.equal((html.match(/<main[ >]/g) || []).length, 1, `${file}: one main landmark`);
    assert.match(html, /href="#main">Skip to content/);
    assert.doesNotMatch(html, /<script[^>]*src="https?:/);
    assert.doesNotMatch(html, /<link[^>]*(?:fonts\.googleapis|cdn\.)/);
  }
  const home = await read('index.html');
  assert.equal((home.match(/class="session-card"/g) || []).length, 24);
  assert.match(await read('assets/site.css'), /prefers-reduced-motion: reduce/);
  assert.match(await read('assets/site.css'), /forced-colors: active/);
  assert.match(await read('assets/site.css'), /@media print/);
});

test('every learner PDF is a titled two-page document with the correct language', async () => {
  for (const s of sessions) {
    const pdf = await PDFDocument.load(await fs.readFile(path.join(dist, `learner-sheets/${s.slug}.pdf`)));
    assert.equal(pdf.getPageCount(), 2, s.slug);
    assert.ok(pdf.getTitle().includes(s.title));
    assert.equal(pdf.catalog.get(PDFName.of('Lang')).decodeText(), 'en-GB');
    assert.ok(pdf.getPages().every(p => p.getWidth() > 590 && p.getHeight() > 840));
  }
});

test('manifest includes properly scoped launch URLs, actual install icons and a maskable icon', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  assert.equal(manifest.start_url, base); assert.equal(manifest.scope, base); assert.equal(manifest.id, base);
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable'));
  for (const i of manifest.icons) assert.ok(files.includes(i.src.slice(base.length)));
});

function workerHarness({ rejectInstall = false } = {}) {
  const handlers = {}, saved = new Map(), deleted = [], cacheName = [];
  let claimed = false, skipped = false;
  const cache = { async addAll(requests) { if (rejectInstall) throw new Error('download failed'); requests.forEach(r => saved.set(r.url, new Response(r.url))); }, async match(key) { return saved.get(String(key)); } };
  const scope = `https://example.test${base}`;
  const self = { registration: { scope }, addEventListener(name, handler) { handlers[name] = handler; }, clients: { async claim() { claimed = true; } }, skipWaiting() { skipped = true; } };
  const caches = { async open(name) { cacheName.push(name); return cache; }, async delete(name) { deleted.push(name); }, async keys() { return ['unrelated-cache', 'core-another-installation-old', ...(cacheName.length ? [cacheName[0] + '-old', cacheName[0]] : [])]; } };
  const context = { self, caches, URL, Response, Request: class { constructor(p) { this.url = new URL(p, scope).href; } }, fetch: async () => { throw new Error('offline'); } };
  return { handlers, saved, deleted, cacheName, self, context, get claimed() { return claimed; }, get skipped() { return skipped; } };
}
test('worker caches the complete course and PDFs, normalises directory URLs and works offline', async () => {
  const code = await read('sw.js'); assert.doesNotMatch(code, /__(VERSION|SCOPE_KEY|PRECACHE)__/);
  const h = workerHarness(); vm.runInNewContext(code, h.context);
  let wait; h.handlers.install({ waitUntil(p) { wait = p; } }); await wait;
  for (const s of sessions) {
    assert.ok(h.saved.has(`https://example.test${base}sessions/${s.slug}/index.html`));
    assert.ok(h.saved.has(`https://example.test${base}learner-sheets/${s.slug}.pdf`));
  }
  let response;
  h.handlers.fetch({ request: { method: 'GET', url: `https://example.test${base}sessions/${sessions[0].slug}/?from=home`, mode: 'navigate' }, respondWith(p) { response = p; } });
  assert.equal((await response).status, 200);
  assert.ok((await (await response).text()).endsWith('index.html'));
  response = null;
  h.handlers.fetch({ request: { method: 'GET', url: `https://example.test${base}missing/`, mode: 'navigate' }, respondWith(p) { response = p; } });
  assert.ok((await (await response).text()).endsWith('offline.html'));
  h.handlers.activate({ waitUntil(p) { wait = p; } }); await wait;
  assert.ok(h.claimed); assert.ok(!h.deleted.includes('unrelated-cache'));
  assert.ok(h.deleted.includes(h.cacheName[0] + '-old'));
  assert.ok(!h.deleted.includes('core-another-installation-old'));
  h.handlers.message({ data: { type: 'SKIP_WAITING' } }); assert.ok(h.skipped);
});
test('failed precache installation rejects and removes the partial edition', async () => {
  const h = workerHarness({ rejectInstall: true }); vm.runInNewContext(await read('sw.js'), h.context);
  let wait; h.handlers.install({ waitUntil(p) { wait = p; } }); await assert.rejects(wait, /download failed/);
  assert.ok(h.deleted.includes(h.cacheName[0]));
});
test('worker leaves external URLs, other scopes and non-GET requests alone', async () => {
  const h = workerHarness(); vm.runInNewContext(await read('sw.js'), h.context);
  const requests = [{ method: 'POST', url: `https://example.test${base}` }, { method: 'GET', url: 'https://www.vatican.va/' }];
  if (base !== '/') requests.push({ method: 'GET', url: 'https://example.test/other-app/' });
  for (const request of requests) h.handlers.fetch({ request, respondWith() { assert.fail('request should not be intercepted'); } });
});
