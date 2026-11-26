// Admin dashboard: edit the portfolio content and publish it to GitHub in one
// commit; Vercel rebuilds the site from the new commit. No server, no database.
import { Repo, GitHubError, bytesToB64 } from './github.js';
import { renderHome, renderProject, validate, projectHref } from './render.js';

const SITE = 'content/site.json';
const PROJECTS = 'content/projects.json';
const IMAGES = 'content/images/';
const CONN_KEY = 'pf-admin-conn';
// the site root, also when it lives in a sub-folder such as /portfolio/
const SITE_BASE = location.pathname.replace(/\/admin(\/.*)?$/, '');

const S = {
  repo: null, info: null, head: null, contentShas: {},
  base: { site: '', projects: '' },
  site: null, projects: [],
  pending: new Map(), // new images not yet published: name -> {url, b64}
  cache: new Map(), // existing images: name -> object URL (or a Promise while loading)
  view: 'works', edit: -1,
};

// ---------------------------------------------------------------- helpers
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
const ICONS = {
  plus: 'M12 5v14M5 12h14', up: 'M12 19V5M6 11l6-6 6 6', down: 'M12 5v14M6 13l6 6 6-6', edit: 'M4 20h4L19 9l-4-4L4 16v4z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1.1',
  star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z', upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  back: 'M15 6l-6 6 6 6', out: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11', image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01', x: 'M6 6l12 12M18 6L6 18',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
};
const icon = (n) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', 'ic');
  s.innerHTML = `<path d="${ICONS[n]}"/>`;
  return s;
};
const btn = (label, onclick, { cls = '', ic, title, disabled } = {}) =>
  h('button', { type: 'button', class: 'btn ' + cls, onclick, title: title || (ic && !label ? '' : null), 'aria-label': !label ? title : null, disabled }, ic ? icon(ic) : null, label ? h('span', null, label) : null);

function toast(msg, kind = '') {
  const t = h('div', { class: 'toast ' + kind }, msg);
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), kind === 'err' ? 9000 : 4000);
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const json = (x) => JSON.stringify(x, null, 2) + '\n';
const bi = (v) => (v && typeof v === 'object' ? v : { ar: v || '', en: '' });

// ---------------------------------------------------------------- dirty state
function referencedImages() {
  const out = new Set();
  if (S.site && S.site.photo) out.add(S.site.photo);
  for (const p of S.projects) {
    if (p.cover && p.cover.src) out.add(p.cover.src);
    for (const g of p.gallery || []) if (g.src) out.add(g.src);
  }
  return out;
}
const changed = () => ({
  site: json(S.site) !== S.base.site,
  projects: json(S.projects) !== S.base.projects,
  images: [...S.pending.keys()].filter((n) => referencedImages().has(n)),
});
function refreshDirty() {
  const c = changed();
  const n = (c.site ? 1 : 0) + (c.projects ? 1 : 0) + c.images.length;
  const badge = document.querySelector('.dirty');
  if (badge) badge.textContent = n ? `تغييرات غير منشورة (${n})` : 'لا تغييرات غير منشورة';
  if (badge) badge.classList.toggle('on', !!n);
  const pub = document.querySelector('.publish');
  if (pub) pub.disabled = !n;
  return n;
}
window.addEventListener('beforeunload', (e) => { if (S.site && refreshDirty()) { e.preventDefault(); e.returnValue = ''; } });

// ---------------------------------------------------------------- images
function imageURL(name) {
  if (!name) return Promise.resolve('');
  if (S.pending.has(name)) return Promise.resolve(S.pending.get(name).url);
  if (!S.cache.has(name)) {
    S.cache.set(name, S.repo.readBytes(IMAGES + name, S.head).then((bytes) => {
      const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.jpg') || name.endsWith('.jpeg') ? 'image/jpeg' : name.endsWith('.svg') ? 'image/svg+xml' : 'image/webp';
      return URL.createObjectURL(new Blob([bytes], { type }));
    }).catch(() => ''));
  }
  return Promise.resolve(S.cache.get(name));
}
function thumb(name, cls = 'thumb') {
  const im = h('img', { class: cls, alt: '' });
  if (name) imageURL(name).then((u) => { if (u) im.src = u; else im.classList.add('missing'); });
  else im.classList.add('empty');
  return im;
}

// resize in the browser and save as WebP (JPEG where WebP encoding is missing)
async function processImage(file, base) {
  const bmp = await createImageBitmap(file);
  const max = 1800;
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height * 0.75));
  const w = Math.round(bmp.width * k), hgt = Math.round(bmp.height * k);
  const c = document.createElement('canvas');
  c.width = w; c.height = hgt;
  c.getContext('2d').drawImage(bmp, 0, 0, w, hgt);
  let blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.82));
  let ext = 'webp';
  if (!blob || blob.type !== 'image/webp') { blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85)); ext = 'jpg'; }
  const safe = (base || 'image').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
  const name = `${safe}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.${ext}`;
  const b64 = bytesToB64(new Uint8Array(await blob.arrayBuffer()));
  S.pending.set(name, { url: URL.createObjectURL(blob), b64, size: blob.size });
  return name;
}
function pickImages(multiple, base) {
  return new Promise((resolve) => {
    const inp = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', multiple: multiple || null });
    inp.onchange = async () => {
      const out = [];
      for (const f of inp.files) {
        if (f.size > 25 * 1024 * 1024) { toast(`«${f.name}» أكبر من 25 ميغابايت.`, 'err'); continue; }
        try { out.push(await processImage(f, base)); } catch { toast(`تعذر قراءة الصورة «${f.name}».`, 'err'); }
      }
      resolve(out);
    };
    inp.click();
  });
}

// ---------------------------------------------------------------- inputs bound to the state
function textIn(obj, key, { label, multiline, rows = 3, dir, placeholder, hint, onchange } = {}) {
  const attrs = {
    class: 'in', value: obj[key] ?? '', dir: dir || null, placeholder: placeholder || null,
    oninput: (e) => { obj[key] = e.target.value; refreshDirty(); if (onchange) onchange(e.target.value); },
  };
  const control = multiline ? h('textarea', Object.assign(attrs, { rows })) : h('input', Object.assign(attrs, { type: 'text' }));
  if (multiline) control.value = obj[key] ?? '';
  return label ? h('label', { class: 'f' }, h('span', { class: 'lb' }, label), control, hint ? h('span', { class: 'hint' }, hint) : null) : control;
}
// a field in both languages, side by side
function biIn(parent, key, label, opts = {}) {
  parent[key] = bi(parent[key]);
  return h('div', { class: 'f bi' }, h('span', { class: 'lb' }, label, opts.hint ? h('span', { class: 'hint' }, opts.hint) : null),
    h('div', { class: 'pair' },
      h('div', null, h('span', { class: 'lang' }, 'عربي'), textIn(parent[key], 'ar', { ...opts, dir: 'rtl' })),
      h('div', null, h('span', { class: 'lang' }, 'English'), textIn(parent[key], 'en', { ...opts, dir: 'ltr' }))));
}
function check(obj, key, label, onchange) {
  return h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!obj[key], onchange: (e) => { obj[key] = e.target.checked; refreshDirty(); if (onchange) onchange(); } }), label);
}
const section = (title, ...kids) => h('section', { class: 'card' }, h('h3', null, title), ...kids);
function move(arr, i, j, after) { if (j < 0 || j >= arr.length) return; const [x] = arr.splice(i, 1); arr.splice(j, 0, x); refreshDirty(); after(); }

// ---------------------------------------------------------------- connect
function connectScreen(err) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(CONN_KEY) || sessionStorage.getItem(CONN_KEY) || '{}'); } catch { /* ignore */ }
  const v = { owner: saved.owner || 'jihadTH4', repo: saved.repo || 'portfolio-2026-v2', branch: saved.branch || 'main', token: saved.token || '', remember: !!localStorage.getItem(CONN_KEY) };
  const go = async () => {
    if (!v.owner || !v.repo || !v.token) { toast('أكمل اسم الحساب والمستودع ورمز الوصول.', 'err'); return; }
    const store = v.remember ? localStorage : sessionStorage;
    (v.remember ? sessionStorage : localStorage).removeItem(CONN_KEY);
    store.setItem(CONN_KEY, JSON.stringify({ owner: v.owner.trim(), repo: v.repo.trim(), branch: v.branch.trim() || 'main', token: v.token.trim() }));
    await connect();
  };
  const form = h('form', { class: 'connect card', onsubmit: (e) => { e.preventDefault(); go(); } },
    h('h1', null, 'لوحة تحكم معرض الأعمال'),
    h('p', { class: 'muted' }, 'تعدّل المحتوى هنا، وعند النشر يُحفظ في مستودع GitHub الخاص بالموقع، ثم يعيد Vercel بناء الموقع خلال دقيقة تقريباً.'),
    err ? h('p', { class: 'alert' }, err) : null,
    h('div', { class: 'grid2' }, textIn(v, 'owner', { label: 'حساب GitHub', dir: 'ltr', placeholder: 'jihadTH4' }), textIn(v, 'repo', { label: 'المستودع', dir: 'ltr', placeholder: 'portfolio' })),
    textIn(v, 'branch', { label: 'الفرع', dir: 'ltr', placeholder: 'main' }),
    (() => { const f = textIn(v, 'token', { label: 'رمز الوصول (Fine-grained token)', dir: 'ltr', placeholder: 'github_pat_…' }); f.querySelector('input').type = 'password'; f.querySelector('input').autocomplete = 'off'; return f; })(),
    h('details', { class: 'help' }, h('summary', null, 'كيف أنشئ رمز الوصول؟'),
      h('ol', null,
        h('li', null, 'GitHub ← Settings ← Developer settings ← Personal access tokens ← Fine-grained tokens ← Generate new token.'),
        h('li', null, 'Repository access: Only select repositories، واختر مستودع الموقع فقط.'),
        h('li', null, 'Permissions ← Repository permissions ← Contents: Read and write. لا شيء غيرها.'),
        h('li', null, 'حدد مدة صلاحية (90 يوماً مثلاً)، وانسخ الرمز والصقه هنا.'))),
    check(v, 'remember', 'تذكّر الاتصال على هذا الجهاز فقط (لا تفعّلها على جهاز مشترك)'),
    h('button', { class: 'btn primary wide', type: 'submit' }, 'اتصال وتحميل المحتوى'));
  mount(h('div', { class: 'center' }, form));
}

async function connect() {
  let conn;
  try { conn = JSON.parse(localStorage.getItem(CONN_KEY) || sessionStorage.getItem(CONN_KEY) || 'null'); } catch { conn = null; }
  if (!conn || !conn.token) { connectScreen(); return; }
  mount(h('p', { class: 'boot' }, 'جارٍ تحميل المحتوى من GitHub…'));
  try {
    S.repo = new Repo(conn);
    S.info = await S.repo.info();
    if (S.info.permissions && !S.info.permissions.push) throw new GitHubError(403, 'الرمز يستطيع القراءة فقط. امنحه صلاحية Contents: Read and write.');
    S.head = await S.repo.headSha();
    const [site, projects] = await Promise.all([S.repo.readText(SITE, S.head), S.repo.readText(PROJECTS, S.head)]);
    S.contentShas = { [SITE]: site.sha, [PROJECTS]: projects.sha };
    S.site = JSON.parse(site.text);
    S.projects = JSON.parse(projects.text);
    S.base = { site: json(S.site), projects: json(S.projects) };
    S.pending.clear();
    S.view = 'works'; S.edit = -1;
    shell();
  } catch (e) {
    connectScreen(e instanceof GitHubError ? e.message : 'تعذر قراءة المحتوى: ' + e.message);
  }
}
function signOut() {
  if (refreshDirty() && !confirm('لديك تغييرات غير منشورة ستضيع. هل تريد الخروج؟')) return;
  localStorage.removeItem(CONN_KEY); sessionStorage.removeItem(CONN_KEY);
  S.site = null; S.repo = null;
  connectScreen();
}

// ---------------------------------------------------------------- shell
function mount(node) { const app = document.getElementById('app'); app.replaceChildren(node); }

function shell() {
  const tab = (id, label) => h('button', { type: 'button', class: 'tab' + (S.view === id || (id === 'works' && S.view === 'edit') ? ' on' : ''), onclick: () => { S.view = id; S.edit = -1; shell(); } }, label);
  const body = S.view === 'profile' ? profileView() : S.view === 'edit' ? editView(S.projects[S.edit]) : worksView();
  mount(h('div', { class: 'shell' },
    h('header', { class: 'bar' },
      h('div', { class: 'who' }, h('b', null, (S.site.name && S.site.name.ar) || 'معرض الأعمال'), h('span', { class: 'muted ltr' }, `${S.repo.owner}/${S.repo.repo} · ${S.repo.branch}`)),
      h('nav', { class: 'tabs' }, tab('works', 'الأعمال'), tab('profile', 'الملف الشخصي')),
      h('div', { class: 'acts' },
        h('span', { class: 'dirty' }),
        btn('معاينة الرئيسية', () => preview('home'), { ic: 'eye' }),
        btn('نشر التغييرات', publishDialog, { cls: 'primary publish', ic: 'upload' }),
        btn('', signOut, { ic: 'out', title: 'خروج' }))),
    h('main', { class: 'body' }, body)));
  refreshDirty();
}

// ---------------------------------------------------------------- works list
function blankProject() {
  return {
    slug: '', kind: 'case', featured: false, hidden: true, year: String(new Date().getFullYear()),
    title: { ar: '', en: '' }, summary: { ar: '', en: '' }, role: { ar: '', en: '' }, tags: [],
    cover: { src: '', alt: { ar: '', en: '' } }, gallery: [], body: { ar: '', en: '' }, links: [], note: { ar: '', en: '' },
  };
}
function worksView() {
  const list = h('ol', { class: 'works' });
  const draw = () => {
    list.replaceChildren(...S.projects.map((p, i) => h('li', { class: 'work' + (p.hidden ? ' hidden' : '') },
      thumb(p.cover && p.cover.src),
      h('div', { class: 'wt' },
        h('b', null, (p.title && (p.title.ar || p.title.en)) || 'بلا عنوان'),
        h('span', { class: 'muted' }, [p.kind === 'exercise' ? 'تمرين' : 'مشروع', p.year, p.hidden ? 'مخفي' : 'منشور', p.featured ? 'الأبرز' : ''].filter(Boolean).join('، '))),
      h('div', { class: 'wa' },
        btn('', () => { S.projects.forEach((x) => { x.featured = x === p ? !p.featured : false; }); refreshDirty(); draw(); }, { ic: 'star', cls: 'icon' + (p.featured ? ' lit' : ''), title: p.featured ? 'إلغاء «الأبرز»' : 'اجعله المشروع الأبرز' }),
        btn('', () => { p.hidden = !p.hidden; refreshDirty(); draw(); }, { ic: p.hidden ? 'eyeOff' : 'eye', cls: 'icon', title: p.hidden ? 'إظهاره في الموقع' : 'إخفاؤه من الموقع' }),
        btn('', () => move(S.projects, i, i - 1, draw), { ic: 'up', cls: 'icon', title: 'أعلى', disabled: i === 0 }),
        btn('', () => move(S.projects, i, i + 1, draw), { ic: 'down', cls: 'icon', title: 'أسفل', disabled: i === S.projects.length - 1 }),
        btn('تعديل', () => { S.view = 'edit'; S.edit = i; shell(); }, { ic: 'edit' }),
        btn('', () => {
          if (!confirm(`حذف «${(p.title && (p.title.ar || p.title.en)) || 'هذا العمل'}» من الموقع؟ يمكنك التراجع بعدم النشر.`)) return;
          S.projects.splice(i, 1); refreshDirty(); draw();
        }, { ic: 'trash', cls: 'icon danger', title: 'حذف' })))));
    if (!S.projects.length) list.append(h('li', { class: 'empty' }, 'لا توجد أعمال بعد. أضف أول عمل.'));
  };
  draw();
  return h('div', null,
    h('div', { class: 'head' }, h('div', null, h('h2', null, 'الأعمال'), h('p', { class: 'muted' }, 'الترتيب هنا هو ترتيبها في الموقع. النجمة تحدد المشروع الأبرز في أعلى الصفحة.')),
      btn('عمل جديد', () => { S.projects.unshift(blankProject()); S.view = 'edit'; S.edit = 0; shell(); }, { cls: 'primary', ic: 'plus' })),
    list);
}

// ---------------------------------------------------------------- one work
function slugify(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }

function editView(p) {
  if (!p) { S.view = 'works'; return worksView(); }
  p.cover = p.cover || { src: '', alt: { ar: '', en: '' } };
  p.gallery = p.gallery || []; p.links = p.links || []; p.tags = p.tags || [];
  const slugBox = { v: p.slug };
  const slugIn = textIn(slugBox, 'v', {
    label: 'الرابط المختصر (slug)', dir: 'ltr', placeholder: 'my-project', hint: 'يظهر في عنوان الصفحة: /work/…/ — أحرف إنجليزية صغيرة وأرقام وشرطات.',
    onchange: (x) => { p.slug = slugify(x); },
  });
  const tagsBox = { v: (p.tags || []).join('، ') };

  const coverBox = h('div', { class: 'cover' });
  const drawCover = () => coverBox.replaceChildren(
    thumb(p.cover.src, 'big'),
    h('div', { class: 'row' },
      btn(p.cover.src ? 'تغيير صورة الغلاف' : 'رفع صورة الغلاف', async () => { const [n] = await pickImages(false, p.slug || 'cover'); if (n) { p.cover.src = n; refreshDirty(); drawCover(); } }, { ic: 'upload' }),
      p.cover.src ? btn('إزالة', () => { p.cover.src = ''; refreshDirty(); drawCover(); }, { cls: 'ghost' }) : null));
  drawCover();

  const gal = h('div', { class: 'gal' });
  const drawGal = () => gal.replaceChildren(...p.gallery.map((g, i) => {
    g.caption = bi(g.caption);
    return h('div', { class: 'gi' }, thumb(g.src),
      h('div', { class: 'gi-f' }, biIn(g, 'caption', 'التعليق', { multiline: true, rows: 2 })),
      h('div', { class: 'gi-a' },
        btn('', () => move(p.gallery, i, i - 1, drawGal), { ic: 'up', cls: 'icon', title: 'أعلى', disabled: i === 0 }),
        btn('', () => move(p.gallery, i, i + 1, drawGal), { ic: 'down', cls: 'icon', title: 'أسفل', disabled: i === p.gallery.length - 1 }),
        btn('', () => { p.gallery.splice(i, 1); refreshDirty(); drawGal(); }, { ic: 'trash', cls: 'icon danger', title: 'إزالة الصورة' })));
  }), p.gallery.length ? '' : h('p', { class: 'muted' }, 'لا صور في المعرض.'));
  drawGal();

  const links = h('div', { class: 'links' });
  const drawLinks = () => links.replaceChildren(...p.links.map((l, i) => {
    l.label = bi(l.label);
    return h('div', { class: 'lk' },
      h('div', { class: 'grid3' }, textIn(l.label, 'ar', { label: 'النص بالعربية', placeholder: 'الموقع' }), textIn(l.label, 'en', { label: 'English', dir: 'ltr', placeholder: 'Live' }), textIn(l, 'url', { label: 'الرابط', dir: 'ltr', placeholder: 'https://…' })),
      btn('', () => { p.links.splice(i, 1); refreshDirty(); drawLinks(); }, { ic: 'trash', cls: 'icon danger', title: 'حذف الرابط' }));
  }), btn('إضافة رابط', () => { p.links.push({ label: { ar: '', en: '' }, url: '' }); refreshDirty(); drawLinks(); }, { ic: 'link', cls: 'ghost' }));
  drawLinks();

  return h('div', { class: 'editor' },
    h('div', { class: 'head' },
      h('div', null, btn('كل الأعمال', () => { S.view = 'works'; S.edit = -1; shell(); }, { ic: 'back', cls: 'ghost' }), h('h2', null, (p.title && (p.title.ar || p.title.en)) || 'عمل جديد')),
      btn('معاينة الصفحة', () => preview('project', p), { ic: 'eye' })),
    section('الأساسيات',
      biIn(p, 'title', 'العنوان', { hint: 'الرابط المختصر يُملأ من العنوان الإنجليزي ما دام فارغاً.' }),
      h('div', { class: 'grid3' },
        slugIn,
        h('label', { class: 'f' }, h('span', { class: 'lb' }, 'النوع'),
          h('select', { class: 'in', onchange: (e) => { p.kind = e.target.value; refreshDirty(); } },
            h('option', { value: 'case', selected: p.kind !== 'exercise' || null }, 'مشروع (له صفحة)'),
            h('option', { value: 'exercise', selected: p.kind === 'exercise' || null }, 'تمرين (بطاقة صغيرة)'))),
        textIn(p, 'year', { label: 'السنة', dir: 'ltr', placeholder: '2026' })),
      h('div', { class: 'row' },
        check(p, 'hidden', 'مخفي من الموقع (مسودة)'),
        check(p, 'featured', 'المشروع الأبرز', () => { if (p.featured) S.projects.forEach((x) => { if (x !== p) x.featured = false; }); })),
      biIn(p, 'summary', 'وصف قصير', { multiline: true, rows: 2, hint: 'يظهر في القائمة وفي محركات البحث. جملة أو جملتان.' }),
      biIn(p, 'role', 'دوري في المشروع', { multiline: true, rows: 2 }),
      textIn(tagsBox, 'v', { label: 'التقنيات', dir: 'ltr', placeholder: 'Go، JavaScript، Excel', hint: 'افصل بينها بفاصلة.', onchange: (x) => { p.tags = x.split(/[,،]/).map((t) => t.trim()).filter(Boolean); } })),
    section('صورة الغلاف', coverBox, biIn(p.cover, 'alt', 'وصف الصورة لقارئات الشاشة')),
    section('نص الصفحة',
      biIn(p, 'body', 'المحتوى', { multiline: true, rows: 14, hint: 'سطر فارغ يبدأ فقرة جديدة. السطر الذي يبدأ بعلامتي ## يصير عنواناً، والذي يبدأ بشرطة يصير نقطة في قائمة.' })),
    section('معرض الصور', gal, btn('إضافة صور', async () => {
      const names = await pickImages(true, p.slug || 'shot');
      names.forEach((n) => p.gallery.push({ src: n, caption: { ar: '', en: '' } }));
      if (names.length) { refreshDirty(); drawGal(); }
    }, { ic: 'image' })),
    section('الروابط', links, biIn(p, 'note', 'ملاحظة بجانب الروابط', { hint: 'مثال: الكود خاص — عرض مباشر عند الطلب' })),
    h('p', { class: 'muted foot' }, 'التعديلات محفوظة في هذه الصفحة حتى تضغط «نشر التغييرات».'));
}

// fill the slug from the English title while the slug is still empty
document.addEventListener('input', (e) => {
  if (S.view !== 'edit' || !e.target.matches('.bi .pair > div:last-child .in')) return;
  const p = S.projects[S.edit];
  const titleBox = e.target.closest('.bi');
  if (!p || !titleBox || titleBox !== document.querySelector('.editor .card .bi')) return;
  if (!p.slug || p._autoSlug) {
    p.slug = slugify(p.title.en); p._autoSlug = true;
    const s = document.querySelector('.editor .grid3 input'); if (s) s.value = p.slug;
  }
});

// ---------------------------------------------------------------- profile
function listEditor(arr, make, row, addLabel) {
  const box = h('div', { class: 'stack' });
  const draw = () => box.replaceChildren(...arr.map((x, i) => h('div', { class: 'lk' }, row(x),
    h('div', { class: 'gi-a' },
      btn('', () => move(arr, i, i - 1, draw), { ic: 'up', cls: 'icon', title: 'أعلى', disabled: i === 0 }),
      btn('', () => move(arr, i, i + 1, draw), { ic: 'down', cls: 'icon', title: 'أسفل', disabled: i === arr.length - 1 }),
      btn('', () => { arr.splice(i, 1); refreshDirty(); draw(); }, { ic: 'trash', cls: 'icon danger', title: 'حذف' })))),
  btn(addLabel, () => { arr.push(make()); refreshDirty(); draw(); }, { ic: 'plus', cls: 'ghost' }));
  draw();
  return box;
}
function profileView() {
  const s = S.site;
  s.links = s.links || []; s.skills = s.skills || []; s.certificates = s.certificates || [];
  const photo = h('div', { class: 'cover' });
  const drawPhoto = () => photo.replaceChildren(thumb(s.photo, 'portrait'), h('div', { class: 'row' },
    btn(s.photo ? 'تغيير الصورة' : 'رفع صورة', async () => { const [n] = await pickImages(false, 'portrait'); if (n) { s.photo = n; refreshDirty(); drawPhoto(); } }, { ic: 'upload' }),
    s.photo ? btn('إزالة', () => { s.photo = ''; refreshDirty(); drawPhoto(); }, { cls: 'ghost' }) : null));
  drawPhoto();
  return h('div', { class: 'editor' },
    h('div', { class: 'head' }, h('h2', null, 'الملف الشخصي')),
    section('التعريف', biIn(s, 'name', 'الاسم'), biIn(s, 'role', 'المسمى'), biIn(s, 'intro', 'جملة التعريف في أعلى الصفحة', { multiline: true, rows: 3 }),
      biIn(s, 'available', 'حالة التوفر', { hint: 'اتركها فارغة لإخفائها.' }), biIn(s, 'location', 'المكان')),
    section('الصورة الشخصية', photo),
    section('عني', biIn(s, 'about', 'النص', { multiline: true, rows: 8, hint: 'سطر فارغ = فقرة جديدة.' })),
    section('التواصل', h('div', { class: 'grid2' }, textIn(s, 'email', { label: 'البريد الإلكتروني', dir: 'ltr' }), textIn(s, 'siteUrl', { label: 'رابط الموقع', dir: 'ltr', hint: 'للروابط في محركات البحث وخريطة الموقع.' })),
      listEditor(s.links, () => ({ label: { ar: '', en: '' }, url: '' }), (l) => { l.label = bi(l.label); return h('div', { class: 'grid3' }, textIn(l.label, 'ar', { label: 'الاسم' }), textIn(l.label, 'en', { label: 'English', dir: 'ltr' }), textIn(l, 'url', { label: 'الرابط', dir: 'ltr' })); }, 'إضافة رابط')),
    section('المهارات', listEditor(s.skills, () => ({ group: { ar: '', en: '' }, items: [] }), (g) => {
      g.group = bi(g.group);
      const box = { v: (g.items || []).join('، ') };
      return h('div', { class: 'grid3' }, textIn(g.group, 'ar', { label: 'المجموعة' }), textIn(g.group, 'en', { label: 'English', dir: 'ltr' }),
        textIn(box, 'v', { label: 'المهارات (بفاصلة)', dir: 'ltr', onchange: (x) => { g.items = x.split(/[,،]/).map((t) => t.trim()).filter(Boolean); } }));
    }, 'إضافة مجموعة')),
    section('الشهادات', listEditor(s.certificates, () => ({ title: { ar: '', en: '' }, issuer: { ar: '', en: '' }, year: '', url: '' }), (c) => {
      c.title = bi(c.title); c.issuer = bi(c.issuer);
      return h('div', { class: 'stack' }, biIn(c, 'title', 'الشهادة'), biIn(c, 'issuer', 'الجهة'),
        h('div', { class: 'grid2' }, textIn(c, 'year', { label: 'السنة', dir: 'ltr' }), textIn(c, 'url', { label: 'رابط التحقق', dir: 'ltr' })));
    }, 'إضافة شهادة')));
}

// ---------------------------------------------------------------- preview
async function preview(kind, p) {
  const names = [...referencedImages()];
  const urls = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await imageURL(n)])));
  const o = {
    site: S.site, projects: S.projects.filter((x) => x.slug), year: new Date().getFullYear(),
    img: (src) => urls[src] || '', asset: (f) => SITE_BASE + '/assets/' + f, dims: null,
  };
  const lang = 'ar';
  let html;
  try { html = kind === 'home' ? renderHome(o, lang) : renderProject(o, lang, { ...p, slug: p.slug || 'preview' }); }
  catch (e) { toast('تعذرت المعاينة: ' + e.message, 'err'); return; }
  html = html.replace(/<script[\s\S]*?<\/script>/g, ''); // the preview never runs scripts
  const frame = h('iframe', { title: 'معاينة', sandbox: 'allow-same-origin' });
  frame.srcdoc = html;
  const close = () => ov.remove();
  const ov = h('div', { class: 'overlay', onclick: (e) => { if (e.target === ov) close(); } },
    h('div', { class: 'modal wide' },
      h('div', { class: 'mh' }, h('b', null, kind === 'home' ? 'معاينة الصفحة الرئيسية' : 'معاينة صفحة المشروع'), h('span', { class: 'muted' }, 'غير منشورة بعد — الروابط معطلة في المعاينة'), btn('', close, { ic: 'x', cls: 'icon', title: 'إغلاق' })),
      frame));
  document.body.append(ov);
  ov.querySelector('button').focus();
  ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

// ---------------------------------------------------------------- publish
function publishDialog() {
  const c = changed();
  const errs = validate(S.site, S.projects);
  const files = [];
  if (c.site) files.push('الملف الشخصي');
  if (c.projects) files.push('الأعمال');
  if (c.images.length) files.push(`${c.images.length} صورة جديدة`);
  const msg = { v: 'تحديث المحتوى من لوحة التحكم' };
  const status = h('p', { class: 'muted' });
  const go = btn('نشر الآن', async () => {
    go.disabled = true;
    try {
      await publish(msg.v, (t) => { status.textContent = t; });
      ov.remove();
      toast('نُشرت التغييرات. سيظهر الموقع المحدّث خلال دقيقة تقريباً بعد أن يعيد Vercel بناءه.', 'ok');
    } catch (e) {
      status.textContent = '';
      go.disabled = false;
      toast(e.message, 'err');
    }
  }, { cls: 'primary', ic: 'upload', disabled: !!errs.length });
  const ov = h('div', { class: 'overlay' }, h('div', { class: 'modal' },
    h('div', { class: 'mh' }, h('b', null, 'نشر التغييرات'), btn('', () => ov.remove(), { ic: 'x', cls: 'icon', title: 'إغلاق' })),
    h('div', { class: 'mb' },
      errs.length ? h('div', { class: 'alert' }, h('b', null, 'صحّح هذه الأخطاء قبل النشر:'), h('ul', null, errs.map((e) => h('li', { class: 'ltr' }, e)))) : null,
      h('p', null, 'سيُنشر: ', files.join('، ') || 'لا شيء'),
      textIn(msg, 'v', { label: 'وصف التحديث (يظهر في سجل GitHub)' }),
      status),
    h('div', { class: 'mf' }, go, btn('إلغاء', () => ov.remove(), { cls: 'ghost' }))));
  document.body.append(ov);
}

async function publish(message, step) {
  step('التحقق من أحدث نسخة على GitHub');
  const head = await S.repo.headSha();
  if (head !== S.head) {
    // someone (or another tab) pushed since we loaded: only safe if the content files are untouched
    const now = await S.repo.fileShas(head, [SITE, PROJECTS]);
    if (now[SITE] !== S.contentShas[SITE] || now[PROJECTS] !== S.contentShas[PROJECTS]) {
      throw new Error('تغيّر المحتوى على GitHub منذ فتحت اللوحة (من جهاز أو نافذة أخرى). لن أكتب فوقه. انسخ تعديلاتك، ثم أعد تحميل اللوحة.');
    }
  }
  // tidy the data: drop helper fields
  for (const p of S.projects) delete p._autoSlug;
  const c = changed();
  const files = [];
  if (c.site) files.push({ path: SITE, text: json(S.site) });
  if (c.projects) files.push({ path: PROJECTS, text: json(S.projects) });
  for (const n of c.images) files.push({ path: IMAGES + n, b64: S.pending.get(n).b64 });
  // images no longer used anywhere are removed from the repository
  const before = new Set();
  const collect = (site, projects) => {
    if (site.photo) before.add(site.photo);
    for (const p of projects) { if (p.cover && p.cover.src) before.add(p.cover.src); for (const g of p.gallery || []) before.add(g.src); }
  };
  collect(JSON.parse(S.base.site), JSON.parse(S.base.projects));
  const now = referencedImages();
  for (const n of before) if (!now.has(n) && !S.pending.has(n)) files.push({ path: IMAGES + n, delete: true });
  if (!files.length) throw new Error('لا توجد تغييرات للنشر.');
  const sha = await S.repo.commit(files, message || 'تحديث المحتوى', head, step);
  // the published state becomes the new base
  S.head = sha;
  S.base = { site: json(S.site), projects: json(S.projects) };
  const shas = await S.repo.fileShas(sha, [SITE, PROJECTS]);
  S.contentShas = shas;
  for (const n of c.images) { S.cache.set(n, Promise.resolve(S.pending.get(n).url)); S.pending.delete(n); }
  refreshDirty();
}

connect();
