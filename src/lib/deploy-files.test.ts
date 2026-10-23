import assert from 'node:assert/strict';
import { test } from 'node:test';
import { zipSync, strToU8 } from 'fflate';
import { extractZip, parseLegacyPages, decodeContent, routeCandidates, MAX_UPLOAD } from './deploy-files.ts';
const zip = (files: Record<string, string | Uint8Array>) => zipSync(Object.fromEntries(Object.entries(files).map(([path, data]) => [path, typeof data === 'string' ? strToU8(data) : data])));
test('ZIP preserves nested assets and binary bytes, removing wrapper folders', () => {
  const image = new Uint8Array([0, 255, 128, 10]);
  const pages = extractZip(zip({ 'site/dist/index.html': '<link href="assets/main.css">', 'site/dist/assets/main.css': 'body{color:red}', 'site/dist/assets/image.png': image, '__MACOSX/._index.html': 'metadata' }));
  assert.deepEqual(pages.map(p => p.route).sort(), ['/assets/image.png', '/assets/main.css', '/index.html']);
  const asset = decodeContent(pages.find(p => p.route.endsWith('.png'))!.content);
  assert.equal(asset.mime, 'image/png');
  assert.deepEqual(asset.body, image);
  assert.equal(decodeContent(pages.find(p => p.route.endsWith('.css'))!.content).mime, 'text/css; charset=utf-8');
});
test('HTML from previous deploys is still served verbatim', () => {
  assert.deepEqual(decodeContent('<h1>Hola</h1>'), { body: '<h1>Hola</h1>', mime: 'text/html; charset=utf-8' });
  assert.deepEqual(parseLegacyPages(JSON.stringify([{route:'/hello',content:'hello'}]), true), [{route:'/',content:'hello'}]);
});
test('index and clean HTML routes resolve without masking missing assets', () => {
  assert.ok(routeCandidates('').includes('/index.html'));
  assert.ok(routeCandidates('docs/').includes('/docs/index.html'));
  assert.ok(routeCandidates('about').includes('/about.html'));
  assert.ok(!routeCandidates('missing.js').includes('/index.html'));
});
test('reject invalid archives, missing entry point, unsafe paths and secrets', () => {
  assert.throws(() => extractZip(new Uint8Array([1,2,3])));
  assert.throws(() => extractZip(zip({'main.js':'alert(1)'})), /index.html/);
  assert.throws(() => extractZip(zip({'index.html':'ok','../outside.html':'bad'})), /ruta inválida/);
  assert.throws(() => extractZip(zip({'index.html':'ok','server.php':'code'})), /Formato no admitido/);
  assert.equal(extractZip(zip({'index.html':'ok','.env':'secret'})).length, 1);
});
test('enforce compressed, expanded, per-file and count limits', () => {
  assert.throws(() => extractZip(new Uint8Array(MAX_UPLOAD + 1)), /3 MB/);
  assert.throws(() => extractZip(zip({'index.html':'a'.repeat(512 * 1024 + 1)})), /512 KB/);
  assert.throws(() => extractZip(zip(Object.fromEntries(Array.from({length:501},(_,i)=>[i ? `${i}.txt` : 'index.html','x'])))), /500/);
  assert.throws(() => extractZip(zip(Object.fromEntries(Array.from({length:18},(_,i)=>[i ? `${i}.txt` : 'index.html','x'.repeat(512 * 1024)])))), /8 MB/);
});
test('validate HTML payloads, duplicate routes and storage prefix injection', () => {
  for (const payload of [null, '{}', '[]', '[{"route":"../bad","content":"x"}]', '[{"route":"/","content":"labs:asset:v1:bad"}]', '[{"route":"/","content":"a"},{"route":"/","content":"b"}]']) {
    assert.throws(() => parseLegacyPages(payload, false));
  }
});
