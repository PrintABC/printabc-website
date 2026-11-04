/* PrintABC — catalogs & magazines price calculator (design reference).
   Same formula and limits as /mnt/project-files/catalogs/tz-catalogs.md §2–§3 (tests T01–T11).
   In production the server calculates the price (POST /catalogs?handler=Calculate);
   the browser only shows it and never sends a sum. Constants below = appsettings "Catalogs". */
(function () {
  'use strict';
  var form = document.getElementById('calc');
  if (!form) return;
  var t = window.PRINTABC.t;

  var $ = function (sel) { return document.querySelector(sel); };
  var pagesEl = form.querySelector('#calc-pages'), qtyEl = form.querySelector('#calc-qty');
  var errors = form.querySelectorAll('[data-error]');
  var out = { total: $('#calc-total'), vat: $('#calc-vat'), unit: $('#calc-unit') };
  var next = $('#calc-next'), nextOff = $('#calc-next-off'), cta = $('[data-cta]');
  var priced = $('[data-priced]'), manualBox = $('[data-manual]'), minNote = $('[data-min-note]');
  var coverOpts = $('[data-cover-opts]'), book = $('.cat-book'), stage = $('#cat-preview');
  var bar = document.querySelector('.bottom-bar');

  var PAPER = { 80: { p: 0.091, t: 0.10, spp: 20 }, 130: { p: 0.1485, t: 0.115, spp: 17 }, 170: { p: 0.197, t: 0.15, spp: 13 },
                250: { p: 0.29322, t: 0.24, spp: 8 }, 300: { p: 0.35216, t: 0.29, spp: 6 } };
  var FMT = { A4: { pps: 4, cps: 1, lf: 1 }, A5: { pps: 8, cps: 2, lf: 0.71 }, A6: { pps: 16, cps: 4, lf: 0.5 } };
  var SPIRALS = [{ max: 7, p: 0.80 }, { max: 9, p: 0.92 }, { max: 12, p: 1.10 }, { max: 14, p: 1.25 }];
  var STAPLE_MAX = { 80: 36, 130: 36, 170: 8, 250: 8, 300: 0 };
  var SPIRAL_MAX = { 80: 200, 130: 150, 170: 120, 250: 60, 300: 60 };
  var CLICK = 0.13325, LAM = 0.37 * 3.3 * 0.16104, STAPLES = 0.5, PUNCH = 30, CLOSE = 30, RATE = 200;
  var WASTE = 0.10, THRESHOLD = 200, K_LOW = 5, K_HIGH = 4.5, MIN = 100, MAX = 2000, VAT = 0.18, MIN_QTY = 6;

  var r2 = function (x) { return Math.round((x + Number.EPSILON) * 100) / 100; };
  var money = function (n) { return t.lrm + n.toFixed(2) + ' ₪' + t.lrm; };
  var val = function (name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; };
  var int = function (el) { return /^\s*\d+\s*$/.test(el.value) ? parseInt(el.value, 10) : NaN; };

  function limits(binding, paper, cover) {
    return binding === 'staple' ? { step: 4, min: cover ? 4 : 8, max: STAPLE_MAX[paper] }
                                : { step: 2, min: 20, max: SPIRAL_MAX[paper] };
  }
  function clampPages(n, l) {
    var v = isNaN(n) ? l.min : Math.min(Math.max(n, l.min), l.max);
    v = l.min + Math.round((v - l.min) / l.step) * l.step;
    while (v > l.max) v -= l.step;
    return v;
  }

  /* Steps 1–14 of tz-catalogs.md §3.2. Returns { error } or { manual } or { P, V, inc, per, minApplied }. */
  function price(o) {
    var g = PAPER[o.paper], f = FMT[o.fmt], cg = PAPER[o.coverPaper], q = o.qty, n = o.pages;
    var Cb = Math.ceil(q * n / f.pps) * (g.p + 2 * CLICK);
    var Sc = o.cover ? Math.ceil(q / f.cps) : 0;
    var Cc = Sc * (cg.p + (o.coverPrint === '44' ? 2 : 1) * CLICK);
    var Cl = o.cover && o.lam !== 'none' ? Sc * LAM : 0;
    var T = n / 2 * g.t + (o.cover ? 2 * cg.t : 0);
    var Cm = 0, Cw = 0;
    if (o.binding === 'staple') Cm = q * STAPLES;
    else {
      var sp = null;
      for (var i = 0; i < SPIRALS.length; i++) if (T <= SPIRALS[i].max) { sp = SPIRALS[i]; break; }
      if (!sp) return { error: 'too_thick' };
      Cm = q * sp.p * f.lf;
      var U = Math.ceil((n / 2) / g.spp) + (o.cover ? Math.ceil(2 / cg.spp) : 0);
      Cw = q * (U * PUNCH + CLOSE) / 3600 * RATE;
    }
    var C1 = (Cb + Cc + Cl + Cm + Cw) * (1 + WASTE);
    var raw = r2(C1 * (C1 < THRESHOLD ? K_LOW : K_HIGH)), P = Math.max(MIN, raw);
    if (P > MAX) return { manual: true };
    var V = r2(P * VAT);
    return { P: P, V: V, inc: r2(P + V), per: r2((P + V) / q), minApplied: raw < MIN };
  }

  function setPill(name, value) {
    var el = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (el) el.checked = true;
  }

  function update(fixPages) {
    var o = { fmt: val('fmt'), binding: val('binding'), paper: +val('paper'), cover: val('cover') === 'yes',
              coverPaper: +val('coverPaper'), coverPrint: val('coverPrint'), lam: val('lam') };

    // 300 g block is not allowed for staples
    var p300 = form.querySelector('input[name="paper"][value="300"]');
    p300.disabled = o.binding === 'staple';
    p300.closest('label').classList.toggle('pill--disabled', p300.disabled);
    if (p300.disabled && o.paper === 300) { setPill('paper', '250'); o.paper = 250; }
    coverOpts.hidden = !o.cover;

    var l = limits(o.binding, o.paper, o.cover);
    pagesEl.min = l.min; pagesEl.max = l.max; pagesEl.step = l.step;
    if (fixPages) pagesEl.value = clampPages(int(pagesEl), l);
    $('[data-pages-hint]').textContent = t['binding_' + o.binding] + ', ' + o.paper + ' ' + t.gr + ': ' +
      (l.min === l.max ? t.only + ' ' + l.min + ' ' + t.pg
                       : t.from + ' ' + l.min + ' ' + t.to + ' ' + l.max + ' ' + t.pg + ', ' + t.mult + ' ' + l.step);
    o.pages = int(pagesEl); o.qty = int(qtyEl);

    var err = '';
    if (isNaN(o.pages) || o.pages < l.min) err = 'pages_min';
    else if (o.pages > l.max) err = 'pages_max';
    else if ((o.pages - l.min) % l.step !== 0) err = 'pages_step';
    else if (isNaN(o.qty) || o.qty < MIN_QTY) err = 'qty_min';
    var r = err ? null : price(o);
    if (r && r.error) { err = r.error; r = null; }

    errors.forEach(function (el) { el.hidden = el.getAttribute('data-error') !== err; });
    pagesEl.setAttribute('aria-invalid', /^pages|too_thick/.test(err) ? 'true' : 'false');
    qtyEl.setAttribute('aria-invalid', err === 'qty_min' ? 'true' : 'false');

    var ok = !err, manual = ok && r.manual, hasPrice = ok && !r.manual;
    priced.hidden = manual; manualBox.hidden = !manual;
    out.total.textContent = hasPrice ? money(r.inc) : '— ₪';
    out.vat.textContent = hasPrice ? money(r.V) : '—';
    out.unit.textContent = hasPrice ? money(r.per) : '—';
    minNote.hidden = !(hasPrice && r.minApplied);
    cta.textContent = manual ? t.cta_manual : t.cta;

    var pg = isNaN(o.pages) ? '—' : o.pages, q = isNaN(o.qty) ? '—' : o.qty;
    var bindL = t['binding_' + o.binding];
    var paperShort = t['paper_short_' + o.paper] || (o.paper + ' ' + t.gr);
    var printL = o.coverPrint === '44' ? '4+4' : '4+0';
    $('[data-summary]').textContent = [o.fmt, bindL, pg + ' ' + t.pg + ' · ' + paperShort,
      o.cover ? t.cover_short + ' ' + o.coverPaper + ' ' + t.gr + ' ' + printL + (o.lam !== 'none' ? ' · ' + t['lam_short_' + o.lam] : '') : t.no_cover_short,
      q + ' ' + t.pcs].join(' · ');

    var msg = [t.msg_hello,
      t.msg_fmt + o.fmt + ', ' + bindL.toLowerCase(),
      t.msg_block + pg + ' ' + t.pg + ', ' + t['paper_full_' + o.paper],
      t.msg_cover + (o.cover ? t['paper_full_' + o.coverPaper] + ', ' + t.print + ' ' + printL + ', ' + t['lam_full_' + o.lam] : t.no_cover_short),
      t.msg_qty + q + ' ' + t.pcs,
      hasPrice ? t.msg_price + money(r.inc) + ' ' + t.vat_incl : t.msg_ask,
      t.msg_file].join('\n');
    var href = 'https://wa.me/972508494172?text=' + encodeURIComponent(msg);
    next.href = href; next.hidden = !ok; nextOff.hidden = ok;

    // preview
    book.setAttribute('data-fmt', o.fmt);
    book.setAttribute('data-binding', o.binding);
    book.classList.toggle('cat-book--gloss', o.cover && o.lam === 'gloss');
    $('[data-cover-sub]').textContent = o.fmt + ' · ' + (isNaN(o.pages) ? '—' : o.pages + (o.cover ? 4 : 0)) + ' ' + t.pg;
    stage.setAttribute('aria-label', t.preview_alt + ': ' + o.fmt + ', ' + bindL + ', ' + pg + ' ' + t.pg);
    var chips = $('[data-chips]');
    while (chips.firstChild) chips.removeChild(chips.firstChild);
    [o.fmt, bindL, pg + ' ' + t.pg + ' · ' + o.paper + ' ' + t.gr, o.cover ? t.cover_short + ' ' + o.coverPaper + ' ' + t.gr : t.no_cover_short]
      .forEach(function (c) { var s = document.createElement('span'); s.textContent = c; chips.appendChild(s); });

    if (bar) {
      bar.querySelector('[data-bar-total]').textContent = hasPrice ? out.total.textContent : (manual ? t.by_quote : '— ₪');
      bar.querySelector('[data-bar-ok]').href = href;
      bar.querySelector('[data-bar-ok]').hidden = !ok;
      bar.querySelector('[data-bar-fix]').hidden = ok;
    }
  }

  form.addEventListener('change', function (e) { update(e.target !== qtyEl); });
  form.addEventListener('input', function (e) { if (e.target === pagesEl || e.target === qtyEl) update(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  // Back button: the browser restores the form; recalc from what is in it (tz §4).
  window.addEventListener('pageshow', function () { update(true); });
  update(true);
})();
