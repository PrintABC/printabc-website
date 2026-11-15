/* PrintABC — shared behaviour for every page:
   mobile menu, accessibility panel, page strings helper. */
(function () {
  'use strict';

  // ---- Strings injected by the page (<script type="application/json" id="page-strings">)
  var stringsEl = document.getElementById('page-strings');
  window.PRINTABC = window.PRINTABC || {};
  try { window.PRINTABC.t = stringsEl ? JSON.parse(stringsEl.textContent) : {}; }
  catch (e) { window.PRINTABC.t = {}; }

  // Safe storage (private mode / blocked cookies must not break the page)
  window.PRINTABC.store = {
    get: function (area, key) { try { return window[area].getItem(key); } catch (e) { return null; } },
    set: function (area, key, val) { try { window[area].setItem(key, val); } catch (e) { /* ignore */ } },
    del: function (area, key) { try { window[area].removeItem(key); } catch (e) { /* ignore */ } }
  };
  var store = window.PRINTABC.store;
  var t = window.PRINTABC.t;

  // ---- Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? (t.menu_close || 'Close menu') : (t.menu_aria || 'Open menu'));
    menu.hidden = !open;
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  // ---- Accessibility panel
  var a11yBtns = document.querySelectorAll('[data-a11y-open]');
  var panel = document.getElementById('a11y-panel');
  var root = document.documentElement;
  var A11Y_KEY = 'printabc-a11y';
  var state = { text: '', contrast: false, links: false };
  try { state = Object.assign(state, JSON.parse(store.get('localStorage', A11Y_KEY) || '{}')); } catch (e) { /* ignore */ }

  function applyA11y() {
    root.classList.toggle('a11y-text-lg', state.text === 'lg');
    root.classList.toggle('a11y-text-xl', state.text === 'xl');
    root.classList.toggle('a11y-contrast', !!state.contrast);
    root.classList.toggle('a11y-links', !!state.links);
    if (!panel) return;
    panel.querySelectorAll('[data-a11y]').forEach(function (b) {
      var k = b.getAttribute('data-a11y'), v = b.getAttribute('data-value');
      var on = k === 'text' ? state.text === v : !!state[k];
      if (k !== 'reset') b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function setPanel(open, opener) {
    if (!panel) return;
    panel.hidden = !open;
    a11yBtns.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    if (open) { var first = panel.querySelector('button'); if (first) first.focus(); }
    else if (opener) opener.focus();
  }
  a11yBtns.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (b.closest('#mobile-menu')) setMenu(false);
      setPanel(panel.hidden, b);
    });
  });
  if (panel) {
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a11y]');
      if (!b) return;
      var k = b.getAttribute('data-a11y');
      if (k === 'text') state.text = state.text === b.getAttribute('data-value') ? '' : b.getAttribute('data-value');
      else if (k === 'reset') state = { text: '', contrast: false, links: false };
      else if (k === 'close') { setPanel(false, a11yBtns[0]); return; }
      else state[k] = !state[k];
      store.set('localStorage', A11Y_KEY, JSON.stringify(state));
      applyA11y();
    });
  }
  applyA11y();

  // ---- Esc closes menu / panel
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (panel && !panel.hidden) setPanel(false, a11yBtns[0]);
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
})();
