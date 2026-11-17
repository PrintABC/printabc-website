/* PrintABC — envelopes price table (design reference).
   Prices and rules = docs/envelopes/tz.md v1.0 §2–§5.
   The price is calculated in the browser (as on business cards and pinkasim):
   the total is the data-price of the selected cell; there is no server calculation.
   In the product this script goes INLINE into Pages/Envelopes.cshtml (@section Scripts),
   texts come from resx; WhatsApp link = shared WHATSAPP_URL (api.whatsapp.com). */
(function () {
  'use strict';
  var root = document.getElementById('env-calc');
  if (!root) return;
  var t = window.PRINTABC.t, store = window.PRINTABC.store;
  var KEY = 'printabc-envelopes';
  var WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=972508494172&text=';
  var tables = root.querySelectorAll('.env-table');
  var total = document.getElementById('env-total'), next = document.getElementById('env-next');
  var summary = root.querySelector('[data-summary]'), sizeName = root.querySelector('[data-size-name]');
  var errBox = root.querySelector('[data-error]');
  var bar = document.querySelector('.bottom-bar');
  var DEF = { size: 's', print: 'bw', q: 500 };   // tz §3: 11x23, b/w, 500 pcs = 200 ₪
  var sel = DEF;

  function table(size) { return root.querySelector('.env-table[data-size="' + size + '"]'); }
  function qtys(size) { return Array.prototype.map.call(table(size).querySelectorAll('tbody tr'), function (tr) { return +tr.getAttribute('data-qty'); }); }
  function valid(s) {
    return s && table(s.size) && (s.print === 'bw' || s.print === 'c') && qtys(s.size).indexOf(s.q) >= 0;
  }

  function render() {
    if (!valid(sel)) sel = DEF;
    tables.forEach(function (tb) { tb.hidden = tb.getAttribute('data-size') !== sel.size; });
    root.querySelectorAll('input[name="size"]').forEach(function (r) { r.checked = r.value === sel.size; });
    var size = t['size_' + sel.size];
    sizeName.textContent = size;
    var price = null;
    table(sel.size).querySelectorAll('tbody tr').forEach(function (tr) {
      var rowOn = +tr.getAttribute('data-qty') === sel.q;
      tr.classList.toggle('is-selected', rowOn);
      tr.querySelectorAll('.price-btn').forEach(function (b) {
        var on = rowOn && b.getAttribute('data-print') === sel.print;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) price = +b.getAttribute('data-price');
      });
    });
    var ok = price !== null;
    errBox.hidden = ok;
    var qty = sel.q + ' ' + t.pcs;
    // ru: «11 × 23 см · ч/б · 500 шт.»; he: «500 מעטפות 11×23 ס״מ, הדפסה בשחור-לבן»
    summary.textContent = t.units_word
      ? sel.q + ' ' + t.units_word + ' ' + size + ', ' + t['print_' + sel.print]
      : size + ' · ' + t['print_' + sel.print] + ' · ' + qty;
    var money = ok ? t.lrm + price + ' ₪' + t.lrm : '— ₪';
    total.textContent = money;
    var msg = [t.msg_hello, t.msg_size + size, t.msg_print + t['print_msg_' + sel.print],
      t.msg_qty + qty, t.msg_price + money + ' ' + t.vat_incl, t.msg_file].join('\n');
    var href = WHATSAPP_URL + encodeURIComponent(msg);
    next.href = href;
    next.toggleAttribute('aria-disabled', !ok);
    if (bar) {
      bar.querySelector('[data-bar-total]').textContent = money;
      bar.querySelector('[data-bar-ok]').href = href;
    }
    store.set('sessionStorage', KEY, JSON.stringify(sel));
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('.price-btn');
    if (!b) return;
    sel = { size: b.closest('.env-table').getAttribute('data-size'), print: b.getAttribute('data-print'), q: +b.closest('tr').getAttribute('data-qty') };
    render();
  });
  // switching size: print kept; run kept if the size has it, else nearest allowed not above (24x34 has no 250 -> 100), tz §3
  root.addEventListener('change', function (e) {
    if (e.target.name !== 'size') return;
    var k = e.target.value, ok = qtys(k).filter(function (q) { return q <= sel.q; });
    sel = { size: k, print: sel.print, q: ok.length ? ok[ok.length - 1] : qtys(k)[0] };
    render();
  });
  function restore() {
    try { var s = JSON.parse(store.get('sessionStorage', KEY)); if (valid(s)) sel = s; } catch (e) { /* defaults */ }
    render();
  }
  window.addEventListener('pageshow', restore);
  restore();
})();
