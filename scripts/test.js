// Checks the content and the built site: node scripts/test.js
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { md } from '../render.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let failed = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) failed++; };

const r = spawnSync(process.execPath, ['build.js', 'dist-test'], { cwd: ROOT, encoding: 'utf8' });
check(r.status === 0, 'build: ' + (r.stdout + r.stderr).trim());
const out = join(ROOT, 'dist-test');
const pages = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html') && !p.includes('/admin/')) pages.push(p); } };
walk(out);
check(pages.length >= 3, `${pages.length} pages`);
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  for (const [, url] of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
    const f = join(out, url.endsWith('/') ? url + 'index.html' : url);
    if (!existsSync(f)) { check(false, `${p.replace(out, '')} links to missing ${url}`); }
  }
  check(!/undefined|\[object Object\]/.test(html), `${p.replace(out, '')} has no undefined values`);
}
check(md('<script>x</script>') === '<p>&lt;script&gt;x&lt;/script&gt;</p>', 'markdown escapes HTML');
check(md('[a](javascript:alert(1))').includes('javascript') && !md('[a](javascript:alert(1))').includes('href'), 'markdown refuses javascript: links');
spawnSync('rm', ['-rf', out]);
process.exit(failed ? 1 : 0);
