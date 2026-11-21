/* PrintABC — roll-up stand quantity choice (design reference).
   Prices and rules = docs/rollup/tz.md v1.0.1 §2–§5. Totals live in data-price of the qty radios
   (1 pc 280, 2 pcs 540, 3 pcs 750 ₪ incl. VAT); the unit price on the button is text only.
   The price is taken in the browser: total = data-price of the checked radio; no server calculation.
   In the product this script goes INLINE into Pages/Rollup.cshtml (@section Scripts),
   texts come from resx; WhatsApp link = shared WHATSAPP_URL (api.whatsapp.com). */
(function () {
  'use strict';
  var root = document.getElementById('ru-calc');
  if (!root) return;
  var t = window.PRINTABC.t, store = window.PRINTABC.store;
  var KEY = 'printabc-rollup';                       // value: "1" | "2" | "3" (tz §3)
  var WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=972508494172&text=';
  var radios = root.querySelectorAll('input[name="qty"]');
  var total = document.getElementById('ru-total'), next = document.getElementById('ru-next');
  var more = document.getElementById('ru-more');
  var summary = root.querySelector('[data-summary]');
  var bar = document.querySelector('.bottom-bar');
  var DEF = '1';
  var q = DEF;

  function radio(v) { for (var i = 0; i < radios.length; i++) if (radios[i].value === v) return radios[i]; return null; }
  function money(n) { return t.lrm + n + ' ₪' + t.lrm; }       // he: LRM around "280 ₪"; ru: lrm is ""
  function fill(s, n, price) { return s.split('{n}').join(n).split('{price}').join(price); }

  function render() {
    if (!radio(q)) q = DEF;
    var r = radio(q);
    radios.forEach(function (x) { x.checked = x === r; });
    var price = money(+r.getAttribute('data-price'));
    summary.textContent = fill(t.summary, q, price);
    total.textContent = price;
    var msg = [t.wa_hello, t.wa_size, t.wa_kit, fill(t.wa_qty, q, price), fill(t.wa_price, q, price), t.wa_file].join('\n');
    var href = WHATSAPP_URL + encodeURIComponent(msg);
    next.href = href;
    if (bar) {
      bar.querySelector('[data-bar-total]').textContent = price;
      bar.querySelector('[data-bar-ok]').href = href;
    }
    store.set('sessionStorage', KEY, q);
  }

  more.href = WHATSAPP_URL + encodeURIComponent(t.wa_more);
  root.addEventListener('change', function (e) {
    if (e.target.name !== 'qty') return;
    q = e.target.value;
    render();
  });
  function restore() {
    var s = store.get('sessionStorage', KEY);
    q = (s === '1' || s === '2' || s === '3') ? s : DEF;
    render();
  }
  window.addEventListener('pageshow', restore);
  restore();
})();
