/* PrintABC — business-card price table (demo prices, replace with real data / API). */
(function () {
  'use strict';
  var root = document.getElementById('cards-calc');
  if (!root) return;
  var t = window.PRINTABC.t, store = window.PRINTABC.store;
  var table = document.getElementById('price-table');
  var lam = document.getElementById('opt-lam'), rnd = document.getElementById('opt-round');
  var sel = { row: 2, sides: 'two' };
  var bar = document.querySelector('.bottom-bar');

  function row(i) { return table.querySelectorAll('tbody tr')[i]; }
  function render() {
    var r = row(sel.row);
    table.querySelectorAll('tbody tr').forEach(function (tr, i) { tr.classList.toggle('is-selected', i === sel.row); });
    table.querySelectorAll('.price-btn').forEach(function (b) {
      var on = +b.closest('tr').rowIndex - 1 === sel.row && b.getAttribute('data-sides') === sel.sides;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var price = +r.querySelector('[data-sides="' + sel.sides + '"]').getAttribute('data-price');
    var total = price + (lam.checked ? +r.getAttribute('data-lam') : 0) + (rnd.checked ? +r.getAttribute('data-round') : 0);
    var parts = [r.getAttribute('data-qty') + ' ' + t.pcs, sel.sides === 'one' ? t.sides_one : t.sides_two];
    if (lam.checked) parts.push(t.lam_short);
    if (rnd.checked) parts.push(t.opt_round);
    var spec = parts.join(' · ');
    document.getElementById('cards-spec').textContent = spec;
    document.getElementById('cards-total').textContent = total + ' ₪';
    document.getElementById('cards-vat').textContent = (total * 18 / 118).toFixed(2) + ' ₪';
    if (bar) bar.querySelector('[data-bar-total]').textContent = total + ' ₪';
    store.set('sessionStorage', 'printabc-order', JSON.stringify({ product: 'cards', spec: '9×5 ' + t.cm + ' · ' + spec, total: total }));
  }
  table.addEventListener('click', function (e) {
    var b = e.target.closest('.price-btn');
    if (!b) return;
    sel = { row: b.closest('tr').rowIndex - 1, sides: b.getAttribute('data-sides') };
    render();
  });
  lam.addEventListener('change', render);
  rnd.addEventListener('change', render);
  render();
})();
