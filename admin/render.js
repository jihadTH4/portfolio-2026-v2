// Page rendering shared by the build (Node) and the admin preview (browser).
// Pure functions: content in, HTML string out. No dependencies.

export const LANGS = ['ar', 'en'];

const UI = {
  ar: {
    dir: 'rtl', work: 'الأعمال', about: 'عني', contact: 'تواصل', other: 'English', otherLang: 'en',
    theme: 'تبديل المظهر', seeWork: 'شاهد الأعمال', featured: 'المشروع الأبرز', caseStudy: 'اقرأ قصة المشروع',
    more: 'أعمال أخرى', exercises: 'تمارين واجهات', exercisesNote: 'تحديات من Frontend Mentor بنيتها لتعلّم التفاصيل.',
    skills: 'ما أعمل به', certs: 'شهادات', mail: 'راسلني', back: 'كل الأعمال', role: 'دوري', year: 'السنة',
    stack: 'التقنيات', next: 'المشروع التالي', live: 'الموقع', code: 'الكود', rights: 'كل الحقوق محفوظة',
    skip: 'تخطَّ إلى المحتوى', open: 'فتح الصورة بالحجم الكامل', notFound: 'الصفحة غير موجودة', home: 'العودة إلى الرئيسية',
  },
  en: {
    dir: 'ltr', work: 'Work', about: 'About', contact: 'Contact', other: 'العربية', otherLang: 'ar',
    theme: 'Switch theme', seeWork: 'See the work', featured: 'Featured project', caseStudy: 'Read the project story',
    more: 'More work', exercises: 'Interface exercises', exercisesNote: 'Frontend Mentor challenges I built to learn the details.',
    skills: 'What I work with', certs: 'Certificates', mail: 'Email me', back: 'All work', role: 'My role', year: 'Year',
    stack: 'Stack', next: 'Next project', live: 'Live', code: 'Code', rights: 'All rights reserved',
    skip: 'Skip to content', open: 'Open full-size image', notFound: 'Page not found', home: 'Back to home',
  },
};

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const tr = (v, lang) => (v && typeof v === 'object' ? (v[lang] || v[lang === 'ar' ? 'en' : 'ar'] || '') : (v || ''));

// a small, safe subset of Markdown: "## " headings, "- " lists, blank-line paragraphs, **bold**, [text](https://link)
export function md(src) {
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  const out = [];
  let list = null, para = [];
  const flush = () => {
    if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
    if (list) { out.push(`<ul>${list.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`); list = null; }
  };
  for (const raw of String(src || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('## ')) { flush(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (/^[-•] /.test(line)) { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } (list = list || []).push(line.slice(2)); continue; }
    if (list) flush();
    para.push(line);
  }
  flush();
  return out.join('\n');
}

// URLs: Arabic at /, English at /en/
const homeHref = (lang) => (lang === 'ar' ? '/' : '/en/');
export const projectHref = (lang, slug) => `${homeHref(lang)}work/${slug}/`;

function img(o, src, alt, cls, eager) {
  if (!src) return '';
  const d = o.dims ? o.dims(src) : null;
  const size = d ? ` width="${d.w}" height="${d.h}"` : '';
  return `<img src="${esc(o.img(src))}" alt="${esc(alt)}"${size}${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function head(o, lang, { title, desc, path, image }) {
  const u = UI[lang];
  const site = o.site;
  const abs = (p) => (site.siteUrl ? site.siteUrl.replace(/\/$/, '') + p : p);
  const alt = lang === 'ar' ? path.replace(/^\//, '/en/') : path.replace(/^\/en\//, '/');
  return `<!doctype html>
<html lang="${lang}" dir="${u.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(abs(path))}">
<link rel="alternate" hreflang="${lang}" href="${esc(abs(path))}">
<link rel="alternate" hreflang="${u.otherLang}" href="${esc(abs(alt))}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${image ? `<meta property="og:image" content="${esc(abs(o.img(image)))}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#f1f3f8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a1324" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${o.asset('favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;700&display=swap">
<link rel="stylesheet" href="${o.asset('site.css')}">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<script src="${o.asset('site.js')}" defer></script>
</head>`;
}

function header(o, lang, path) {
  const u = UI[lang];
  const other = lang === 'ar' ? path.replace(/^\//, '/en/') : path.replace(/^\/en\//, '/');
  const h = homeHref(lang);
  return `<a class="skip" href="#main">${u.skip}</a>
<header class="top">
  <a class="brand" href="${h}">${esc(tr(o.site.name, lang))}</a>
  <nav aria-label="${u.work}">
    <a href="${h}#work">${u.work}</a>
    <a href="${h}#about">${u.about}</a>
    <a href="${h}#contact">${u.contact}</a>
  </nav>
  <div class="tools">
    <a class="lang" href="${other}" hreflang="${u.otherLang}" lang="${u.otherLang}">${u.other}</a>
    <button class="theme" type="button" aria-label="${u.theme}" title="${u.theme}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg>
    </button>
  </div>
</header>`;
}

function footer(o, lang) {
  const u = UI[lang];
  const y = o.year || new Date().getFullYear();
  return `<footer class="foot"><span>© ${y} ${esc(tr(o.site.name, lang))}</span><span>${esc(tr(o.site.location, lang))}</span></footer>`;
}

const tags = (t) => (t && t.length ? `<ul class="tags">${t.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');

function linkList(o, lang, p) {
  const links = (p.links || []).filter((l) => l.url);
  const note = tr(p.note, lang);
  if (!links.length && !note) return '';
  return `<p class="plinks">${links.map((l) => `<a href="${esc(l.url)}" rel="noopener" target="_blank">${esc(tr(l.label, lang))}</a>`).join('')}${note ? `<span class="note">${esc(note)}</span>` : ''}</p>`;
}


// sketched shapes behind the name, as if drawn in pencil in an engineer's
// notebook: a circle, a square, a triangle, a small node graph and </>.
// Each main shape is traced twice, slightly off, like a hand going over a line.
function shapes() {
  return `<svg class="shapes" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
  <defs><filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7"/>
    <feDisplacementMap in="SourceGraphic" scale="5"/>
  </filter></defs>
  <g filter="url(#pencil)">
  <g class="s-grid"><path d="M60 300h480M300 60v480"/><circle cx="300" cy="300" r="4"/></g>
  <g class="s-circle"><circle cx="300" cy="300" r="210"/><circle class="p2" cx="303" cy="297" r="208"/><path d="M300 82v16M300 502v16M82 300h16M502 300h16"/></g>
  <g class="s-square"><rect x="160" y="160" width="280" height="280"/><rect class="p2" x="163" y="157" width="277" height="282" transform="rotate(1.2 300 300)"/></g>
  <g class="s-tri"><path d="M300 128 449 386H151z"/><path class="p2" d="M302 132 446 389H149z"/></g>
  <g class="s-graph"><path d="M96 118 168 74l70 40M168 74v-44"/><circle cx="96" cy="118" r="6"/><circle cx="168" cy="74" r="6"/><circle cx="238" cy="114" r="6"/><circle cx="168" cy="30" r="6"/></g>
  <g class="s-code"><path d="M470 60l-26 26 26 26M518 60l26 26-26 26M502 52l-16 68"/></g>
  </g>
</svg>`;
}

export function renderHome(o, lang) {
  const u = UI[lang], s = o.site;
  const visible = o.projects.filter((p) => !p.hidden);
  const feat = visible.find((p) => p.featured) || visible.find((p) => p.kind === 'case');
  const cases = visible.filter((p) => p.kind !== 'exercise' && p !== feat);
  const ex = visible.filter((p) => p.kind === 'exercise' && p !== feat);
  const name = tr(s.name, lang);
  const [first, ...rest] = name.split(' ');
  const path = homeHref(lang);
  const caseLink = (p) => (p.kind === 'exercise' && !(tr(p.body, lang) || '').trim() ? null : projectHref(lang, p.slug));

  const featured = feat ? `
<section class="feat" aria-labelledby="feat-t">
  <a class="feat-shot" href="${caseLink(feat)}" tabindex="-1" aria-hidden="true">${img(o, feat.cover && feat.cover.src, tr(feat.cover && feat.cover.alt, lang), '', true)}</a>
  <div class="feat-text">
    <p class="kicker">${u.featured} <span>${esc(feat.year || '')}</span></p>
    <h2 id="feat-t"><a href="${caseLink(feat)}">${esc(tr(feat.title, lang))}</a></h2>
    <p>${esc(tr(feat.summary, lang))}</p>
    ${tags(feat.tags)}
    <a class="btn" href="${caseLink(feat)}">${u.caseStudy}</a>
  </div>
</section>` : '';

  const rows = cases.length ? `
<section class="more" aria-labelledby="more-t">
  <h2 id="more-t" class="sec">${u.more}</h2>
  <ol class="rows">
  ${cases.map((p) => `<li class="row">
    <a class="row-link" href="${caseLink(p)}">
      <span class="row-img">${img(o, p.cover && p.cover.src, tr(p.cover && p.cover.alt, lang))}</span>
      <span class="row-text"><span class="row-t">${esc(tr(p.title, lang))}</span><span class="row-s">${esc(tr(p.summary, lang))}</span></span>
      <span class="row-y">${esc(p.year || '')}</span>
    </a>
  </li>`).join('\n')}
  </ol>
</section>` : '';

  const exercises = ex.length ? `
<section class="ex" aria-labelledby="ex-t">
  <h2 id="ex-t" class="sec">${u.exercises}</h2>
  <p class="sec-note">${u.exercisesNote}</p>
  <ul class="ex-grid">
  ${ex.map((p) => {
    const live = (p.links || []).find((l) => l.url);
    const href = caseLink(p) || (live && live.url) || '#';
    const outside = !caseLink(p) && live;
    return `<li><a href="${esc(href)}"${outside ? ' rel="noopener" target="_blank"' : ''}>${img(o, p.cover && p.cover.src, tr(p.cover && p.cover.alt, lang))}<span class="ex-t">${esc(tr(p.title, lang))}</span><span class="ex-s">${esc(tr(p.summary, lang))}</span></a>
      ${(p.links || []).length ? `<span class="ex-links">${p.links.map((l) => `<a href="${esc(l.url)}" rel="noopener" target="_blank">${esc(tr(l.label, lang))}</a>`).join('')}</span>` : ''}</li>`;
  }).join('\n')}
  </ul>
</section>` : '';

  const skills = (s.skills || []).length ? `<div class="skills"><h3>${u.skills}</h3>${s.skills.map((g) => `<div class="sk"><h4>${esc(tr(g.group, lang))}</h4><p>${g.items.map(esc).join(lang === 'ar' ? '، ' : ', ')}</p></div>`).join('')}</div>` : '';
  const certs = (s.certificates || []).length ? `<div class="certs"><h3>${u.certs}</h3><ul>${s.certificates.map((c) => `<li><a href="${esc(c.url)}" rel="noopener" target="_blank">${esc(tr(c.title, lang))}</a><span>${esc(tr(c.issuer, lang))}${c.year ? ' ' + esc(c.year) : ''}</span></li>`).join('')}</ul></div>` : '';

  return `${head(o, lang, { title: `${name} — ${tr(s.role, lang)}`, desc: tr(s.intro, lang), path, image: feat && feat.cover && feat.cover.src })}
<body class="home">
${header(o, lang, path)}
<main id="main">
<section class="hero">
  ${shapes()}
  <h1 class="name"><span>${esc(first)}</span>${rest.length ? `<span>${esc(rest.join(' '))}</span>` : ''}</h1>
  <div class="hero-side">
    ${s.photo ? `<figure class="portrait">${img(o, s.photo, name, '', true)}</figure>` : ''}
    <p class="role">${esc(tr(s.role, lang))}</p>
    <p class="intro">${esc(tr(s.intro, lang))}</p>
    <p class="cta"><a class="btn" href="#work">${u.seeWork}</a>${s.available ? `<span class="avail">${esc(tr(s.available, lang))}</span>` : ''}</p>
  </div>
</section>
<div id="work" class="work">
${featured}
${rows}
${exercises}
</div>
<section id="about" class="about" aria-labelledby="about-t">
  <h2 id="about-t" class="sec">${u.about}</h2>
  <div class="about-grid">
    <div class="prose">${md(tr(s.about, lang))}</div>
    <div>${skills}${certs}</div>
  </div>
</section>
<section id="contact" class="contact" aria-labelledby="contact-t">
  <h2 id="contact-t" class="sec">${u.contact}</h2>
  ${s.email ? `<a class="mail" href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ''}
  <ul class="socials">${(s.links || []).map((l) => `<li><a href="${esc(l.url)}" rel="noopener" target="_blank">${esc(tr(l.label, lang))}</a></li>`).join('')}</ul>
</section>
</main>
${footer(o, lang)}
</body>
</html>`;
}

export function renderProject(o, lang, p) {
  const u = UI[lang], s = o.site;
  const path = projectHref(lang, p.slug);
  const visible = o.projects.filter((x) => !x.hidden && (x.kind !== 'exercise' || (tr(x.body, lang) || '').trim()));
  const i = visible.findIndex((x) => x.slug === p.slug);
  const next = visible.length > 1 ? visible[(i + 1) % visible.length] : null;
  const role = tr(p.role, lang);
  return `${head(o, lang, { title: `${tr(p.title, lang)} — ${tr(s.name, lang)}`, desc: tr(p.summary, lang), path, image: p.cover && p.cover.src })}
<body class="project">
${header(o, lang, path)}
<main id="main" class="case">
  <p class="crumb"><a href="${homeHref(lang)}#work">${u.back}</a></p>
  <h1>${esc(tr(p.title, lang))}</h1>
  <p class="lede">${esc(tr(p.summary, lang))}</p>
  <dl class="meta">
    ${p.year ? `<div><dt>${u.year}</dt><dd>${esc(p.year)}</dd></div>` : ''}
    ${role ? `<div class="wide"><dt>${u.role}</dt><dd>${esc(role)}</dd></div>` : ''}
    ${(p.tags || []).length ? `<div class="wide"><dt>${u.stack}</dt><dd>${tags(p.tags)}</dd></div>` : ''}
  </dl>
  ${linkList(o, lang, p)}
  ${p.cover && p.cover.src ? `<figure class="cover"><a href="${esc(o.img(p.cover.src))}" title="${u.open}">${img(o, p.cover.src, tr(p.cover.alt, lang), '', true)}</a></figure>` : ''}
  <div class="prose">${md(tr(p.body, lang))}</div>
  ${(p.gallery || []).length ? `<div class="gallery">${p.gallery.map((g) => {
    const cap = tr(g.caption, lang);
    const d = o.dims ? o.dims(g.src) : null;
    const tall = d && d.h > d.w;
    return `<figure class="${tall ? 'tall' : ''}"><a href="${esc(o.img(g.src))}" title="${u.open}">${img(o, g.src, cap)}</a>${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>`;
  }).join('\n')}</div>` : ''}
  ${next && next.slug !== p.slug ? `<p class="next"><span>${u.next}</span><a href="${projectHref(lang, next.slug)}">${esc(tr(next.title, lang))}</a></p>` : ''}
</main>
${footer(o, lang)}
</body>
</html>`;
}

export function render404(o, lang) {
  const u = UI[lang];
  return `${head(o, lang, { title: u.notFound, desc: '', path: homeHref(lang) + '404' })}
<body class="project">
${header(o, lang, homeHref(lang))}
<main id="main" class="case"><h1>${u.notFound}</h1><p><a class="btn" href="${homeHref(lang)}">${u.home}</a></p></main>
${footer(o, lang)}
</body></html>`;
}

// every page of the site: [path, html]
export function renderSite(o) {
  const pages = [];
  for (const lang of LANGS) {
    pages.push([lang === 'ar' ? 'index.html' : 'en/index.html', renderHome(o, lang)]);
    for (const p of o.projects) {
      if (p.hidden) continue;
      if (p.kind === 'exercise' && !(tr(p.body, lang) || '').trim()) continue;
      pages.push([(lang === 'ar' ? '' : 'en/') + `work/${p.slug}/index.html`, renderProject(o, lang, p)]);
    }
  }
  pages.push(['404.html', render404(o, 'ar')]);
  return pages;
}

// checks used by the build and by the admin before publishing
export function validate(site, projects) {
  const errs = [];
  const slugs = new Set();
  if (!tr(site.name, 'ar') && !tr(site.name, 'en')) errs.push('site: name is empty');
  projects.forEach((p, i) => {
    const at = `project ${i + 1}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug || '')) errs.push(`${at}: slug "${p.slug}" must be lowercase letters, numbers and dashes`);
    if (slugs.has(p.slug)) errs.push(`${at}: slug "${p.slug}" is used twice`);
    slugs.add(p.slug);
    if (!tr(p.title, 'ar') && !tr(p.title, 'en')) errs.push(`${at}: title is empty`);
    for (const l of p.links || []) if (l.url && !/^https?:\/\//.test(l.url)) errs.push(`${at}: link "${l.url}" must start with http`);
  });
  return errs;
}
