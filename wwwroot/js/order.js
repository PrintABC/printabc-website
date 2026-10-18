/* PrintABC — order form: summary from sessionStorage, file upload, validation, done state.
   Pickup only. Demo: no data is sent; connect to the backend in submit(). */
(function () {
  'use strict';
  var form = document.getElementById('order-form');
  if (!form) return;
  var t = window.PRINTABC.t, store = window.PRINTABC.store;
  var params = new URLSearchParams(window.location.search);

  // ---- Summary
  var DEFAULTS = {
    stickers: { product: 'stickers', spec: t.sum_spec, total: 83 },
    cards: { product: 'cards', spec: t.sum_spec_cards, total: 230 }
  };
  var data = null;
  try { data = JSON.parse(store.get('sessionStorage', 'printabc-order') || 'null'); } catch (e) { data = null; }
  if (params.get('product') && DEFAULTS[params.get('product')] && (!data || data.product !== params.get('product'))) data = DEFAULTS[params.get('product')];
  if (!data || !DEFAULTS[data.product]) data = DEFAULTS.stickers;
  var isCards = data.product === 'cards';
  document.querySelectorAll('[data-product]').forEach(function (el) { el.hidden = el.getAttribute('data-product') !== data.product; });
  document.getElementById('sum-spec').textContent = data.spec;
  document.getElementById('sum-items').textContent = data.total + ' ₪';
  document.getElementById('sum-total').textContent = data.total + ' ₪';
  document.getElementById('sum-vat').textContent = (data.total * 18 / 118).toFixed(2) + ' ₪';
  document.querySelectorAll('[data-bar-total]').forEach(function (el) { el.textContent = data.total + ' ₪'; });
  form.elements.product.value = data.product + ': ' + data.spec + ' — ' + data.total + ' ₪';

  // ---- File
  var fileInput = document.getElementById('f-file-input');
  var drop = document.getElementById('dropzone');
  var fileName = document.getElementById('file-name');
  var fileOk = document.getElementById('file-ok');
  var fileRemove = document.getElementById('file-remove');
  var file = null, fileErr = '';
  function takeFile(f) {
    if (!f) return;
    file = f;
    fileErr = !/\.(pdf|png|jpe?g)$/i.test(f.name) ? 'type' : (f.size > 100 * 1024 * 1024 ? 'size' : '');
    renderFile();
    if (tried) validate();
  }
  function renderFile() {
    fileName.textContent = file ? file.name : t.up_none;
    fileOk.hidden = !file || !!fileErr;
    fileRemove.hidden = !file;
  }
  document.getElementById('f-file').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () { takeFile(fileInput.files[0]); });
  fileRemove.addEventListener('click', function () { fileInput.value = ''; file = null; fileErr = ''; renderFile(); if (tried) validate(); document.getElementById('f-file').focus(); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-drag'); }); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('is-drag'); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('is-drag'); takeFile(e.dataTransfer && e.dataTransfer.files[0]); });

  // ---- Validation
  var tried = false;
  var checks = {
    file: function () { return !file ? 'e_file' : (fileErr === 'type' ? 'e_file_type' : (fileErr === 'size' ? 'e_file_size' : '')); },
    name: function () { return form.elements.name.value.trim() ? '' : 'e_name'; },
    phone: function () {
      var dgt = form.elements.phone.value.replace(/\D/g, '');
      return (/^0\d{8,9}$/.test(dgt) || /^972\d{8,9}$/.test(dgt)) ? '' : 'e_phone';
    },
    email: function () { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.elements.email.value.trim()) ? '' : 'e_mail'; },
    consent: function () { return form.elements.consent.checked ? '' : 'e_consent'; }
  };
  var order = ['file', 'name', 'phone', 'email', 'consent'];
  function validate() {
    var first = null;
    order.forEach(function (k) {
      var key = checks[k]();
      var err = document.getElementById('e-' + k);
      var ctl = document.getElementById('f-' + k);
      var show = tried && !!key;
      err.hidden = !show;
      if (show) err.querySelector('[data-msg]').textContent = t[key];
      if (k === 'file') drop.classList.toggle('is-invalid', show);
      else ctl.setAttribute('aria-invalid', show ? 'true' : 'false');
      if (show && !first) first = ctl;
    });
    document.getElementById('e-summary').hidden = !(tried && first);
    return first;
  }
  form.addEventListener('input', function () { if (tried) validate(); });
  form.addEventListener('change', function () { if (tried) validate(); });

  function showDone() {
    document.getElementById('order-main').hidden = true;
    document.getElementById('order-done').hidden = false;
    document.querySelectorAll('[data-step="2"]').forEach(function (el) { el.removeAttribute('aria-current'); el.classList.add('is-done'); });
    document.querySelectorAll('[data-step="3"]').forEach(function (el) { el.setAttribute('aria-current', 'step'); });
    var bar = document.querySelector('.bottom-bar [data-form-only]');
    if (bar) bar.hidden = true;
    window.scrollTo(0, 0);
    document.getElementById('done-title').focus();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    tried = true;
    var first = validate();
    if (first) { first.scrollIntoView({ block: 'center' }); first.focus({ preventScroll: true }); return; }
    // TODO backend: POST new FormData(form) (+ file) → order id; then:
    store.del('sessionStorage', 'printabc-order');
    showDone();
  });
  renderFile();
  if (params.get('done') === '1') showDone();   // preview of the success state
})();
