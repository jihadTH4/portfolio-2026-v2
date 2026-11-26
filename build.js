// Builds the static site into dist/ from content/. Node only, no packages.
// Vercel runs it on every push (see vercel.json); locally: node build.js
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderSite, validate } from './render.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
// SITE_BASE=/portfolio when the site lives in a sub-folder (GitHub Pages project site)
const BASE = (process.env.SITE_BASE || '').replace(/\/$/, '');
const OUT = join(ROOT, process.argv[2] || 'dist');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const site = read('content/site.json');
const projects = read('content/projects.json');
const errs = validate(site, projects);
if (errs.length) { console.error('Content errors:\n- ' + errs.join('\n- ')); process.exit(1); }

// image sizes, so the browser reserves space before images load (no layout jumps)
function imageSize(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') { const n = b.readUInt32LE(21); return { w: 1 + (n & 0x3fff), h: 1 + ((n >> 14) & 0x3fff) }; }
    if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const copyDir = (from, to) => {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    const s = join(from, f), d = join(to, f);
    if (statSync(s).isDirectory()) copyDir(s, d); else copyFileSync(s, d);
  }
};
copyDir(join(ROOT, 'content/images'), join(OUT, 'images'));
copyDir(join(ROOT, 'assets'), join(OUT, 'assets'));
copyDir(join(ROOT, 'admin'), join(OUT, 'admin'));
copyFileSync(join(ROOT, 'render.js'), join(OUT, 'admin/render.js'));

// a content hash on asset links lets browsers cache them for a year
const ver = {};
for (const f of readdirSync(join(ROOT, 'assets'))) ver[f] = createHash('sha1').update(readFileSync(join(ROOT, 'assets', f))).digest('hex').slice(0, 10);

const missing = [];
const dims = {};
const o = {
  site, projects, year: new Date().getFullYear(),
  img: (src) => '/images/' + src,
  asset: (f) => `/assets/${f}?v=${ver[f] || '0'}`,
  dims: (src) => {
    if (!(src in dims)) {
      const f = join(ROOT, 'content/images', src);
      if (!existsSync(f)) { missing.push(src); dims[src] = null; } else dims[src] = imageSize(f);
    }
    return dims[src];
  },
};

const pages = renderSite(o);
// every site link is written from the root ("/en/", "/assets/…"); add the sub-folder
const withBase = (html) => (BASE ? html.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`) : html);
for (const [path, html] of pages) {
  const f = join(OUT, path);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, withBase(html));
}
writeFileSync(join(OUT, '.nojekyll'), ''); // GitHub Pages: serve files as they are
if (missing.length) { console.error('Missing images in content/images:\n- ' + [...new Set(missing)].join('\n- ')); process.exit(1); }

if (site.siteUrl) {
  const base = site.siteUrl.replace(/\/$/, '');
  const urls = pages.filter(([p]) => p.endsWith('index.html')).map(([p]) => `${base}/${p.replace(/index\.html$/, '')}`);
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nDisallow: /admin/\nSitemap: ${base}/sitemap.xml\n`);
}
console.log(`Built ${pages.length} pages into ${OUT}`);
