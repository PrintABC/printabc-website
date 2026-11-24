/* PrintABC — PVC banner calculator (design reference).
   Rates and rules = docs/banners/tz.md §2–§5. Rates live in data-* of #bn-calc (ex VAT):
   print 110 ₪/m², min 1 m²; eyelets 30 ₪ first m² + 20 ₪ each next m² (fractional); VAT 1.18.
   Unit price = round((print + eyelets) × 1.18) to whole ₪ (0.5 up); total = unit × qty. Integer math only.
   In the product this script goes INLINE into Pages/Banners.cshtml (@section Scripts),
   texts come from resx; WhatsApp link = shared WHATSAPP_URL (api.whatsapp.com). */
(function () {
  'use strict';
  var root = document.getElementById('bn-calc');
  if (!root) return;
  var t = window.PRINTABC.t, store = window.PRINTABC.store;
  var KEY = 'printabc-banners';                      // value: "w|h|e|q", e = 1 eyelets / 0 none (tz §3)
  var WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=972508494172&text=';
  var d = root.dataset;
  var P = +d.printM2, Mn = +d.minM2 * 10000, F = +d.eyeletFirst, N = +d.eyeletNext, V = Math.round(+d.vat * 100);
  var DEF = { w: '100', h: '70', e: '1', q: '1' };
  var inW = document.getElementById('bn-w'), inH = document.getElementById('bn-h'), inQ = document.getElementById('bn-q');
  var sizeErr = document.getElementById('bn-size-err'), qtyErr = document.getElementById('bn-qty-err');
  var big = document.getElementById('bn-big'), more = document.getElementById('bn-more');
  var next = document.getElementById('bn-next'), total = document.getElementById('bn-total');
  var summary = root.querySelector('[data-summary]'), areaEl = root.querySelector('[data-area]'), unitEl = root.querySelector('[data-unit]');
  var bar = document.querySelector('.bottom-bar');
  var shown = { size: false, qty: false };          // error text appears on change/blur, then follows input

  function money(n) { return t.lrm + n + ' ₪' + t.lrm; }       // he: LRM around "165 ₪"; ru: lrm is ""
  function fill(s, o) { for (var k in o) s = s.split('{' + k + '}').join(o[k]); return s; }
  function isInt(v) { return /^\d+$/.test(String(v).trim()); }
  function fin() { var r = root.querySelector('input[name="fin"]:checked'); return r && r.value === 'n' ? 'n' : 'e'; }

  // tz §3 check order: err_int -> err_min -> err_max
  function check(w, h, q) {
    var s = '', wb = false, hb = false, qe = '';
    if (!isInt(w) || !isInt(h)) { s = 'err_int'; wb = !isInt(w); hb = !isInt(h); }
    else if (+w < 50 || +h < 50) { s = 'err_min'; wb = +w < 50; hb = +h < 50; }
    else if (Math.min(+w, +h) > 100 || Math.max(+w, +h) > 250) { s = 'err_max'; wb = hb = true; }
    if (!isInt(q)) qe = 'err_int'; else if (+q < 1 || +q > 10) qe = 'err_qty';
    return { size: s, wb: wb, hb: hb, qty: qe };
  }
  function unitPrice(A, eyelets) {
    var L = !eyelets ? 0 : (A < 10000 ? F * 10000 : F * 10000 + N * (A - 10000));
    var X = (P * Math.max(A, Mn) + L) * V;
    return Math.floor((X + 500000) / 1000000);
  }
  function showErr(el, key) { el.hidden = !key; el.querySelector('[data-err]').textContent = key ? t[key] : ''; }
  function setOrder(href) {
    [next, bar && bar.querySelector('[data-bar-ok]')].forEach(function (a) {
      if (!a) return;
      if (href) { a.href = href; a.removeAttribute('aria-disabled'); }
      else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); }
    });
  }

  function render() {
    var w = inW.value.trim(), h = inH.value.trim(), q = inQ.value.trim(), f = fin();
    var c = check(w, h, q), ok = !c.size && !c.qty;
    var finish = f === 'e' ? t.finish_e : t.finish_n;
    var vals = { w: w, h: h, n: q, finish: finish };
    summary.textContent = fill(t.summary, vals);
    var showS = shown.size && c.size, showQ = shown.qty && c.qty;
    inW.setAttribute('aria-invalid', showS && c.wb ? 'true' : 'false');
    inH.setAttribute('aria-invalid', showS && c.hb ? 'true' : 'false');
    inQ.setAttribute('aria-invalid', showQ ? 'true' : 'false');
    showErr(sizeErr, showS ? c.size : '');
    showErr(qtyErr, showQ ? c.qty : '');
    big.hidden = !(showS && c.size === 'err_max');
    if (!big.hidden) big.href = WHATSAPP_URL + encodeURIComponent(fill(t.wa_big, vals));
    var price = '—';
    if (ok) {
      var A = +w * +h, n = +q, unit = unitPrice(A, f === 'e'), sum = unit * n;
      var a2 = Math.floor(A / 100);                  // m² truncated to 2 decimals (99 × 101 -> 0,99)
      areaEl.textContent = fill(t.area_val, { a: Math.floor(a2 / 100) + t.sep + ('0' + a2 % 100).slice(-2) }) + (A < 10000 ? ' · ' + t.area_min : '');
      unitEl.textContent = money(unit);
      price = money(sum);
      var msg = [t.wa_hello, t.wa_mat, fill(t.wa_size, vals), f === 'e' ? t.wa_fin_eyelets : t.wa_fin_none, fill(t.wa_qty, vals),
        n > 1 ? fill(t.wa_price_n, { unit: money(unit), total: money(sum) }) : fill(t.wa_price, { price: money(sum) }), t.wa_file].join('\n');
      setOrder(WHATSAPP_URL + encodeURIComponent(msg));
      store.set('sessionStorage', KEY, [w, h, f === 'e' ? '1' : '0', q].join('|'));   // only a fully valid choice
    } else {
      areaEl.textContent = '—'; unitEl.textContent = '—';
      setOrder(null);
    }
    total.textContent = price;
    if (bar) bar.querySelector('[data-bar-total]').textContent = price;
  }

  more.href = WHATSAPP_URL + encodeURIComponent(t.wa_more);
  root.addEventListener('input', render);
  root.addEventListener('change', function (e) {
    if (e.target === inW || e.target === inH) shown.size = true;
    if (e.target === inQ) shown.qty = true;
    render();
  });
  [inW, inH].forEach(function (x) { x.addEventListener('blur', function () { shown.size = true; render(); }); });
  inQ.addEventListener('blur', function () { shown.qty = true; render(); });

  function restore() {
    var s = String(store.get('sessionStorage', KEY) || '').split('|');
    var v = (s.length === 4 && (s[2] === '1' || s[2] === '0')) ? { w: s[0], h: s[1], e: s[2], q: s[3] } : DEF;
    var c = check(v.w, v.h, v.q);
    if (c.size || c.qty) v = DEF;                   // out of range -> defaults (tz §3)
    inW.value = v.w; inH.value = v.h; inQ.value = v.q;
    root.querySelectorAll('input[name="fin"]').forEach(function (r) { r.checked = (r.value === 'e') === (v.e === '1'); });
    shown.size = shown.qty = false;
    render();
  }
  window.addEventListener('pageshow', restore);
  restore();
})();
