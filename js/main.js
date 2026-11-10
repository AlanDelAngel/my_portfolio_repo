/* =========================================================
   Alan Del Angel portfolio - page behavior
   1. Light / dark mode toggle
   2. Project and certification filters
   3. Copy buttons (email and phone)
   4. Name typed out like a terminal
   5. Credly badge fallback
   6. Scroll reveal animations
   7. Remember the chosen language
   8. Optional profile photo in the hero diamond
   ========================================================= */

/* UI strings follow the page language set in <html lang> */
var IS_EN = (document.documentElement.lang || '').indexOf('en') === 0;
var UI = IS_EN
  ? { toLight: 'Switch to light mode', toDark: 'Switch to dark mode', light: 'Light mode', dark: 'Dark mode', copied: 'Copied', copy: 'Copy', selected: 'Selected' }
  : { toLight: 'Cambiar a modo claro', toDark: 'Cambiar a modo oscuro', light: 'Modo claro', dark: 'Modo oscuro', copied: 'Copiado', copy: 'Copiar', selected: 'Seleccionado' };

/* ---------- 1. Light / dark mode ---------- */
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);

  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function isDark() {
    var theme = root.getAttribute('data-theme');
    if (theme) return theme === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function updateLabel() {
    btn.setAttribute('aria-label', isDark() ? UI.toLight : UI.toDark);
    btn.setAttribute('title', isDark() ? UI.light : UI.dark);
  }
  updateLabel();
  btn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    updateLabel();
  });
})();

/* ---------- 2. Filters (projects and certifications) ----------
   Each .filters group has data-items="selector" pointing to the elements
   it filters. Each button has data-filter="..." and each element has
   data-categories="..." with one or more space-separated categories.
   "all" shows everything. */
(function () {
  document.querySelectorAll('.filters[data-items]').forEach(function (group) {
    var buttons = group.querySelectorAll('.filter');
    var items = document.querySelectorAll(group.dataset.items);
    if (!buttons.length || !items.length) return;

    function apply(filter) {
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === filter)); });
      items.forEach(function (item) {
        var categories = (item.dataset.categories || '').split(/\s+/);
        item.hidden = !(filter === 'all' || categories.indexOf(filter) !== -1);
        if (!item.hidden) item.classList.add('in', 'done');
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.dataset.filter); });
    });
    var start = group.querySelector('.filter[aria-pressed="true"]');
    apply(start ? start.dataset.filter : 'all');
  });
})();

/* ---------- 3. Copy buttons ---------- */
(function () {
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done() {
        btn.textContent = UI.copied;
        setTimeout(function () { btn.textContent = UI.copy; }, 1600);
      }
      function fallback() {
        var el = btn.parentElement.querySelector('.value');
        var range = document.createRange(); range.selectNodeContents(el);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        btn.textContent = UI.selected;
      }
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
  });
})();

/* ---------- 4. Name typed out like a terminal ----------
   Types the name letter by letter with a block cursor at the end, waits,
   erases it and types it again. Tune the timing here: */
(function () {
  var TYPE_SPEED = 75;        // ms per letter while typing
  var ERASE_SPEED = 35;       // ms per letter while erasing
  var HOLD_TIME = 30000;      // how long the full name stays before erasing
  var EMPTY_PAUSE = 600;      // pause on the empty line before retyping

  var h1 = document.getElementById('typed-name');
  if (!h1) return;
  // Visitors who asked for reduced motion get the name as static text
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Read the name and its colored spans straight from the HTML
  var letters = [];
  h1.childNodes.forEach(function (node) {
    var cls = node.nodeType === 1 ? node.className : '';
    (node.textContent || '').split('').forEach(function (ch) { letters.push({ ch: ch, cls: cls }); });
  });
  var fullName = h1.textContent.replace(/\s+/g, ' ').trim();

  var ghost = document.createElement('span');
  ghost.className = 'ghost';
  ghost.setAttribute('aria-hidden', 'true');
  while (h1.firstChild) ghost.appendChild(h1.firstChild);
  var typed = document.createElement('span');
  typed.className = 'typed';
  typed.setAttribute('aria-hidden', 'true');
  h1.setAttribute('aria-label', fullName);
  h1.classList.add('typewriter');
  h1.appendChild(ghost);
  h1.appendChild(typed);

  function escapeHtml(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function render(count) {
    var html = '', current = null, buffer = '';
    function flush() {
      if (!buffer) return;
      html += current ? '<span class="' + current + '">' + escapeHtml(buffer) + '</span>' : escapeHtml(buffer);
      buffer = '';
    }
    for (var i = 0; i < count; i++) {
      if (letters[i].cls !== current) { flush(); current = letters[i].cls; }
      buffer += letters[i].ch;
    }
    flush();
    typed.innerHTML = html + '<span class="cursor"></span>';
  }

  // The "typing" class stops the cursor from blinking while it types or erases
  var count = 0;
  function typeNext() {
    h1.classList.add('typing');
    render(count);
    if (count < letters.length) { count++; setTimeout(typeNext, TYPE_SPEED); }
    else { h1.classList.remove('typing'); setTimeout(eraseNext, HOLD_TIME); }
  }
  function eraseNext() {
    h1.classList.add('typing');
    render(count);
    if (count > 0) { count--; setTimeout(eraseNext, ERASE_SPEED); }
    else { h1.classList.remove('typing'); setTimeout(typeNext, EMPTY_PAUSE); }
  }
  render(0);
  setTimeout(typeNext, 400);
})();

/* ---------- 5. Credly badge fallback ----------
   Each badge shows the issuer's initials until its image loads.
   If the image never loads, the initials stay. */
(function () {
  document.querySelectorAll('.cert .badge img').forEach(function (img) {
    function onLoad() { img.parentElement.classList.add('ok'); }
    if (img.complete && img.naturalWidth > 0) onLoad();
    else img.addEventListener('load', onLoad);
  });
})();

/* ---------- 6. Scroll reveal animations ----------
   Each block fades in as it enters the viewport.
   Cards inside a grid appear one after another. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var GROUPS = '.projects, .cert-grid, .timeline, .skills, .langs ul, .stats .wrap';
  var targets = [];
  document.querySelectorAll('.block > .wrap > *, .stats .wrap, .contact .wrap > *').forEach(function (el) {
    if (el.matches(GROUPS)) {
      Array.prototype.forEach.call(el.children, function (child, i) {
        if (child.matches('.langs')) { targets.push(child); return; }
        child.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
        targets.push(child);
      });
    } else {
      targets.push(el);
    }
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('in');
      observer.unobserve(el);
      var delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
      setTimeout(function () { el.classList.add('done'); }, delay + 650);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(function (el) {
    el.classList.add('reveal');
    observer.observe(el);
  });
})();

/* ---------- 7. Remember the chosen language ----------
   Clicking ES or EN stores the choice, so the home page stops
   switching languages on its own. */
(function () {
  document.querySelectorAll('a[hreflang]').forEach(function (link) {
    link.addEventListener('click', function () {
      try { localStorage.setItem('lang', link.getAttribute('hreflang')); } catch (e) {}
    });
  });
})();

/* ---------- 8. Optional profile photo ----------
   If assets/img/photo.jpg exists, it replaces the "AD" initials.
   If it does not, the image is removed and the initials stay. */
(function () {
  document.querySelectorAll('.emblem .photo').forEach(function (img) {
    var emblem = img.closest('.emblem');
    function show() {
      img.hidden = false;
      if (emblem) emblem.classList.add('has-photo');
    }
    if (img.complete) {
      if (img.naturalWidth > 0) show(); else img.remove();
    } else {
      img.addEventListener('load', show);
      img.addEventListener('error', function () { img.remove(); });
    }
  });
})();
