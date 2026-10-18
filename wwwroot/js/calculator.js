/* PrintABC — sticker price calculator (demo formula, replace with the real price API).
   Limits: size 1×1 … 31.5×46 cm (rotation allowed), round Ø ≤ 31.5 cm,
   integer quantity, order total 60–1000 ₪ incl. VAT. */
(function () {
  'use strict';
  var form = document.getElementById('calc');
  if (!form) return;
  var t = window.PRINTABC.t, store = window.PRINTABC.store;

  var $ = function (sel) { return form.querySelector(sel); };
  var w = $('#calc-w'), h = $('#calc-h'), d = $('#calc-d'), qty = $('#calc-qty');
  var rectFields = $('#size-rect'), roundFields = $('#size-round');
  var errors = form.querySelectorAll('[data-error]');
  var out = { total: $('#calc-total'), vat: $('#calc-vat'), unit: $('#calc-unit') };
  var next = $('#calc-next'), nextOff = $('#calc-next-off');
  var bar = document.querySelector('.bottom-bar');

  var RATE = { paper: 0.010, plastic: 0.016 };       // ₪ per cm² per piece (demo)
  var SHAPE_MULT = { round: 1, rect: 1, free: 1.2 };
  var SETUP = 20;                                      // ₪ per order (demo)
  var num = function (el) { return parseFloat(String(el.value).replace(',', '.')); };
  var money = function (n) { return n.toFixed(2).replace(/\.00$/, '') + ' ₪'; };
  var val = function (name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; };
  var labelOf = function (name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.closest('label').textContent.trim() : ''; };

  function calc() {
    var shape = val('shape'), round = shape === 'round';
    rectFields.hidden = round; roundFields.hidden = !round;
    var W = round ? num(d) : num(w), H = round ? W : num(h);
    var q = /^\s*\d+\s*$/.test(qty.value) ? parseInt(qty.value, 10) : NaN;

    var err = '';
    if (!(W >= 1) || !(H >= 1)) err = 'size';
    else if (round ? W > 31.5 : !((W <= 31.5 && H <= 46) || (W <= 46 && H <= 31.5))) err = 'big';
    else if (!(q >= 1)) err = 'qty';
    var total = err ? 0 : Math.round(SETUP + q * W * H * RATE[val('material')] * SHAPE_MULT[shape]);
    if (!err && total < 60) err = 'min';
    if (!err && total > 1000) err = 'max';

    errors.forEach(function (el) { el.hidden = el.getAttribute('data-error') !== err; });
    [w, h, d].forEach(function (el) { el.setAttribute('aria-invalid', (err === 'size' || err === 'big') ? 'true' : 'false'); });
    qty.setAttribute('aria-invalid', err === 'qty' ? 'true' : 'false');

    var ok = !err;
    out.total.textContent = ok ? total + ' ₪' : '— ₪';
    out.vat.textContent = ok ? money(total * 18 / 118) : '—';
    out.unit.textContent = ok ? money(total / q) : '—';
    next.hidden = !ok; nextOff.hidden = ok;
    if (bar) {
      bar.querySelector('[data-bar-total]').textContent = out.total.textContent;
      bar.querySelector('[data-bar-ok]').hidden = !ok;
      bar.querySelector('[data-bar-fix]').hidden = ok;
    }
    if (ok) {
      var size = round ? '⌀' + W : W + '×' + H;
      store.set('sessionStorage', 'printabc-order', JSON.stringify({
        product: 'stickers',
        spec: [labelOf('material'), labelOf('shape'), size + ' ' + t.cm, labelOf('cut'), q + ' ' + t.pcs].join(' · '),
        total: total
      }));
    }
  }
  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  form.addEventListener('submit', function (e) { e.preventDefault(); if (!next.hidden) window.location.href = next.getAttribute('href'); });
  calc();
})();
