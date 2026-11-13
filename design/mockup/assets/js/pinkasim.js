/* PrintABC — accounting books (pinkasim) price table (design reference).
   Prices and rules = docs/pinkasim/tz.md §2 (appsettings "Pinkasim").
   In production the table is rendered by the server from config and the price comes from
   POST /pinkasim?handler=Calculate; the browser only shows it and never sends a sum. */
(function () {
  'use strict';
  var root = document.getElementById('pk-calc');
  if (!root) return;
  var t = window.PRINTABC.t, store = window.PRINTABC.store;
  var KEY = 'printabc-pinkasim';
  var tables = root.querySelectorAll('.pk-table');
  var total = document.getElementById('pk-total'), next = document.getElementById('pk-next');
  var summary = root.querySelector('[data-summary]'), kindName = root.querySelector('[data-kind-name]');
  var errBox = root.querySelector('[data-error]');
  var bar = document.querySelector('.bottom-bar');
  var sel = { kind: 'a5', copies: 3, q: 4 };

  function table(kind) { return root.querySelector('.pk-table[data-kind="' + kind + '"]'); }
  function qtys(kind) { return Array.prototype.map.call(table(kind).querySelectorAll('tbody tr'), function (tr) { return +tr.getAttribute('data-qty'); }); }
  function books(n) {
    if (t.book_one) return n === 1 ? t.book_one : n + ' ' + t.book_many;
    var m10 = n % 10, m100 = n % 100;
    return n + ' ' + (m10 === 1 && m100 !== 11 ? t.book_1 : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? t.book_2 : t.book_5);
  }
  function valid(s) {
    return s && table(s.kind) && (s.copies === 2 || s.copies === 3) && qtys(s.kind).indexOf(s.q) >= 0;
  }

  function render() {
    tables.forEach(function (tb) { tb.hidden = tb.getAttribute('data-kind') !== sel.kind; });
    root.querySelectorAll('input[name="kind"]').forEach(function (r) { r.checked = r.value === sel.kind; });
    kindName.textContent = t['kind_' + sel.kind];
    var price = null;
    table(sel.kind).querySelectorAll('tbody tr').forEach(function (tr) {
      var rowOn = +tr.getAttribute('data-qty') === sel.q;
      tr.classList.toggle('is-selected', rowOn);
      tr.querySelectorAll('.price-btn').forEach(function (b) {
        var on = rowOn && +b.getAttribute('data-copies') === sel.copies;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) price = +b.getAttribute('data-price');
      });
    });
    var ok = price !== null;
    errBox.hidden = ok;
    var qtyTxt = t.book_one ? books(sel.q) + ', ' + t.sets : books(sel.q) + ' ' + t.sets;
    summary.textContent = t['kind_' + sel.kind] + t.rlm + ' · ' + t['copies_' + sel.copies] + ' · ' + qtyTxt;
    var money = ok ? t.lrm + price + ' ₪' + t.lrm : '— ₪';
    total.textContent = money;
    var msg = [t.msg_hello, t.msg_kind + t['kind_msg_' + sel.kind], t.msg_copies + t['copies_msg_' + sel.copies],
      t.msg_qty + qtyTxt, t.msg_price + money + ' ' + t.vat_incl, t.msg_start, t.msg_file].join('\n');
    var href = 'https://wa.me/972508494172?text=' + encodeURIComponent(msg);
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
    sel = { kind: b.closest('.pk-table').getAttribute('data-kind'), copies: +b.getAttribute('data-copies'), q: +b.closest('tr').getAttribute('data-qty') };
    render();
  });
  // switching kind: nearest allowed quantity not above the current one, copies kept (tz §3)
  root.addEventListener('change', function (e) {
    if (e.target.name !== 'kind') return;
    var k = e.target.value, ok = qtys(k).filter(function (q) { return q <= sel.q; });
    sel = { kind: k, copies: sel.copies, q: ok.length ? ok[ok.length - 1] : qtys(k)[0] };
    render();
  });
  function restore() {
    try { var s = JSON.parse(store.get('sessionStorage', KEY)); if (valid(s)) sel = s; } catch (e) { /* defaults */ }
    render();
  }
  window.addEventListener('pageshow', restore);
  restore();
})();
