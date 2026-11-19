/* PrintABC — events printing (invitations & postcards) price table (design reference).
   Prices and rules = docs/events/tz.md v0.9 §2–§5. PRICES ARE NOT SET YET (v0.9):
   cells have data-price="" and show "—"; fill data-price in the markup in v1.0, the script does not change.
   The price is calculated in the browser (as on envelopes and pinkasim):
   the total is the data-price of the selected cell; there is no server calculation.
   In the product this script goes INLINE into Pages/Events.cshtml (@section Scripts),
   texts come from resx; WhatsApp link = shared WHATSAPP_URL (api.whatsapp.com). */
(function () {
  'use strict';
  var root = document.getElementById('ev-calc');
  if (!root) return;
  var t = window.PRINTABC.t, store = window.PRINTABC.store;
  var KEY = 'printabc-events';
  var WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=972508494172&text=';
  var tables = root.querySelectorAll('.ev-table');
  var total = document.getElementById('ev-total'), next = document.getElementById('ev-next');
  var summary = root.querySelector('[data-summary]'), kindName = root.querySelector('[data-kind-name]');
  var errBox = root.querySelector('[data-error]');
  var bar = document.querySelector('.bottom-bar');
  var DEF = { size: 'a', paper: '300', sides: '1', q: 100 };   // tz §3: 10x15, 300 g, 1 side, 100 pcs
  var sel = DEF;

  function table(s) { return root.querySelector('.ev-table[data-size="' + s.size + '"][data-paper="' + s.paper + '"]'); }
  function cell(s) {
    var tb = table(s);
    return tb && tb.querySelector('tr[data-qty="' + s.q + '"] .price-btn[data-sides="' + s.sides + '"]');
  }
  function valid(s) { return !!(s && typeof s.q === 'number' && cell(s)); }

  function render() {
    if (!valid(sel)) sel = DEF;
    var tb = table(sel), c = cell(sel);
    tables.forEach(function (x) { x.hidden = x !== tb; });
    root.querySelectorAll('input[name="size"]').forEach(function (r) { r.checked = r.value === sel.size; });
    root.querySelectorAll('input[name="paper"]').forEach(function (r) { r.checked = r.value === sel.paper; });
    var size = t['size_' + sel.size], paper = t['paper_' + sel.paper];
    kindName.textContent = size + ' · ' + paper;
    tb.querySelectorAll('tbody tr').forEach(function (tr) {
      tr.classList.toggle('is-selected', +tr.getAttribute('data-qty') === sel.q);
      tr.querySelectorAll('.price-btn').forEach(function (b) { b.setAttribute('aria-pressed', b === c ? 'true' : 'false'); });
    });
    errBox.hidden = !!c;
    var raw = c ? c.getAttribute('data-price') : '';
    var ok = raw !== '' && raw !== null;               // v0.9: no prices yet -> "—", order button disabled
    var qty = sel.q + ' ' + t.pcs, sides = t['sides_' + sel.sides];
    // ru: «10 × 15 см · 300 г · 1 сторона · 100 шт.»; he: «100 הזמנות ⁦10×15⁩ ס״מ, 300 גר׳, צד אחד»
    summary.textContent = t.units_word
      ? sel.q + ' ' + t.units_word + ' ' + size + ', ' + paper + ', ' + sides
      : size + ' · ' + paper + ' · ' + sides + ' · ' + qty;
    var money = ok ? t.lrm + (+raw) + ' ₪' + t.lrm : '— ₪';
    total.textContent = money;
    var msg = [t.msg_hello, t.msg_size + size, t.msg_paper + paper, t.msg_print + t['sides_msg_' + sel.sides],
      t.msg_qty + qty, t.msg_price + money + ' ' + t.vat_incl, t.msg_file].join('\n');
    var href = WHATSAPP_URL + encodeURIComponent(msg);
    next.href = href;
    next.toggleAttribute('aria-disabled', !ok);
    if (bar) {
      bar.querySelector('[data-bar-total]').textContent = money;
      bar.querySelector('[data-bar-ok]').href = href;
      bar.querySelector('[data-bar-ok]').toggleAttribute('aria-disabled', !ok);
    }
    store.set('sessionStorage', KEY, JSON.stringify(sel));
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('.price-btn');
    if (!b) return;
    sel = { size: sel.size, paper: sel.paper, sides: b.getAttribute('data-sides'), q: +b.closest('tr').getAttribute('data-qty') };
    render();
  });
  // switching size or paper keeps run and sides (same run grid in all 8 tables), tz §3
  root.addEventListener('change', function (e) {
    if (e.target.name === 'size') sel = { size: e.target.value, paper: sel.paper, sides: sel.sides, q: sel.q };
    else if (e.target.name === 'paper') sel = { size: sel.size, paper: e.target.value, sides: sel.sides, q: sel.q };
    else return;
    render();
  });
  function restore() {
    try { var s = JSON.parse(store.get('sessionStorage', KEY)); if (valid(s)) sel = s; } catch (e) { /* defaults */ }
    render();
  }
  window.addEventListener('pageshow', restore);
  restore();
})();
