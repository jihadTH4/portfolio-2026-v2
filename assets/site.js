// The only script on the public site: the light/dark switch and gentle
// reveal-on-scroll. Without JavaScript everything is simply visible.
(function () {
  var root = document.documentElement;

  var btn = document.querySelector('.theme');
  if (btn) {
    var dark = function () {
      var t = root.dataset.theme;
      return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    };
    btn.setAttribute('aria-pressed', String(dark()));
    btn.addEventListener('click', function () {
      var next = dark() ? 'light' : 'dark';
      root.dataset.theme = next;
      btn.setAttribute('aria-pressed', String(next === 'dark'));
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    });
  }

  // reveal: elements rise into place once, the first time they scroll into view
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var targets = document.querySelectorAll(
    '.sec, .sec-note, .feat-shot, .feat-text, .rows > li, .ex-grid > li, .about-grid > *, .mail, .socials,' +
    '.case .crumb, .case h1, .lede, .meta, .plinks, .cover, .case > .prose > *, .gallery > figure, .next');
  var vh = window.innerHeight;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  Array.prototype.forEach.call(targets, function (el) {
    if (el.getBoundingClientRect().top < vh * 0.92) return; // already on screen: no animation
    // siblings arrive one after another
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.setProperty('--d', Math.min(i, 5) * 70 + 'ms');
    el.classList.add('rv');
    io.observe(el);
  });
})();
