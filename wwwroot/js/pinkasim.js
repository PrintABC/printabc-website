/* PrintABC — страница «Бухгалтерские книжки» (/pinkasim).
 *
 * Что делает файл:
 *   1. Клиент нажимает цену в таблице → запоминаем выбор {kind, copies, q}.
 *   2. render() перерисовывает всё по этому выбору: подсветку в таблице, название вида,
 *      сводку «Ваш заказ», итог, ссылку WhatsApp и нижнюю панель на телефоне.
 *   3. Выбор сохраняется в sessionStorage, чтобы после «Назад» в браузере он вернулся (ТЗ §3).
 *
 * Цена считается в браузере, как у визиток (решение владельца 15.11, ТЗ v1.1):
 * итог = data-price нажатой кнопки. Таблицу с ценами рисует сервер (Pages/Pinkasim.cshtml).
 *
 * Тексты (на русском или иврите) сюда НЕ пишем. Их кладёт страница в
 * <script type="application/json" id="page-strings">, а main.js превращает в объект window.PRINTABC.t.
 * Пример: t.msg_hello = «Здравствуйте! Хочу заказать бухгалтерские книжки.»
 *
 * Файл подключается с defer после main.js, поэтому window.PRINTABC уже есть.
 */
(function () {
  'use strict';

  // ---- 1. Находим элементы страницы ----------------------------------------------------
  var root = document.getElementById('pk-calc');
  if (!root) return; // не та страница — ничего не делаем

  var t = window.PRINTABC.t;         // тексты страницы
  var store = window.PRINTABC.store; // безопасная обёртка над sessionStorage/localStorage (см. main.js)
  var KEY = 'printabc-pinkasim';     // ключ, под которым храним выбор в sessionStorage

  var waUrl = root.getAttribute('data-wa-url'); // «https://wa.me/972508494172?text=» из Helpers.WHATSAPP_URL
  var tables = root.querySelectorAll('.pk-table');
  var kindName = root.querySelector('[data-kind-name]'); // название вида в заголовке таблицы
  var summary = root.querySelector('[data-summary]');    // строка в «Ваш заказ»
  var errBox = root.querySelector('[data-error]');       // строка ошибки (ТЗ §4)
  var total = document.getElementById('pk-total');       // «Итого»
  var next = document.getElementById('pk-next');         // кнопка «Заказать в WhatsApp»

  // Нижняя панель на телефоне. Есть только если страница выставила ViewData["BottomBar"] = "order".
  var bar = document.querySelector('.bottom-bar');
  var barTotal = bar && bar.querySelector('[data-bar-total]');
  var barOk = bar && bar.querySelector('[data-bar-ok]');

  // Текущий выбор. По умолчанию (ТЗ §3): A5, 3 листа, 4 книжки.
  //   kind   — 'a5' или 'six' (как data-kind у таблицы)
  //   copies — 3 или 2 (как data-copies у кнопки)
  //   q      — количество книжек (как data-qty у строки)
  var sel = { kind: 'a5', copies: 3, q: 4 };

  // ---- 2. Маленькие помощники ----------------------------------------------------------

  // Таблица нужного вида.
  function table(kind) {
    return root.querySelector('.pk-table[data-kind="' + kind + '"]');
  }

  // Список количеств в таблице вида, например для A5 → [1, 2, 4, 10, 20].
  function qtys(kind) {
    var rows = table(kind).querySelectorAll('tbody tr');
    return Array.prototype.map.call(rows, function (tr) { return +tr.getAttribute('data-qty'); });
  }

  // Подставляет значение вместо {0}: fill('Вид: {0}', 'A5') → 'Вид: A5'.
  function fill(template, value) {
    return template.replace('{0}', value);
  }

  // Проверка выбора, прочитанного из sessionStorage: там может оказаться что угодно
  // (старая версия страницы, ручная правка). Берём выбор, только если такая кнопка есть в таблице.
  function valid(s) {
    return !!s && (s.kind === 'a5' || s.kind === 'six') &&
      (s.copies === 2 || s.copies === 3) &&
      qtys(s.kind).indexOf(s.q) >= 0;
  }

  // ---- 3. Перерисовка всего по выбору sel ---------------------------------------------
  function render() {
    // 3.1. Показываем таблицу выбранного вида, вторую прячем; отмечаем радиокнопку вида.
    tables.forEach(function (tb) { tb.hidden = tb.getAttribute('data-kind') !== sel.kind; });
    root.querySelectorAll('input[name="kind"]').forEach(function (r) { r.checked = r.value === sel.kind; });
    kindName.textContent = t['kind_' + sel.kind];

    // 3.2. Подсвечиваем выбранную строку и кнопку, заодно берём цену и текст «4 книжки».
    var price = null, books = '';
    table(sel.kind).querySelectorAll('tbody tr').forEach(function (tr) {
      var rowOn = +tr.getAttribute('data-qty') === sel.q;
      tr.classList.toggle('is-selected', rowOn);
      if (rowOn) books = tr.getAttribute('data-books'); // уже склонено сервером
      tr.querySelectorAll('.price-btn').forEach(function (b) {
        var on = rowOn && +b.getAttribute('data-copies') === sel.copies;
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); // скринридер узнает, что кнопка выбрана
        if (on) price = +b.getAttribute('data-price');
      });
    });

    // 3.3. Если кнопка не нашлась (не должно случаться) — показываем ошибку и «— ₪».
    var ok = price !== null;
    errBox.hidden = ok;

    // 3.4. Тексты. В иврите t.lrm = невидимый символ LRM, в русском — пустая строка.
    //      Он не даёт числу и ₪ поменяться местами в тексте справа налево.
    var money = ok ? t.lrm + price + ' ₪' + t.lrm : '— ₪';
    var qtyText = fill(t.qty_line, books); // «4 книжки по 50 комплектов»

    summary.textContent = t['kind_' + sel.kind] + t.rlm + ' · ' + t['copies_' + sel.copies] + ' · ' + qtyText;
    total.textContent = money;

    // 3.5. Сообщение WhatsApp (ТЗ §5): строки соединяем символом перевода строки '\n',
    //      а всё сообщение кодируем encodeURIComponent — он сам превратит '\n' в %0A,
    //      пробелы в %20, иврит и 📎 в нужные коды. Руками %0a в текстах писать НЕ нужно
    //      (именно из-за ручного «%0📎» ссылка раньше ломалась).
    var msg = [
      t.msg_hello,
      fill(t.msg_kind, t['kind_msg_' + sel.kind]),
      fill(t.msg_copies, t['copies_msg_' + sel.copies]),
      fill(t.msg_qty, qtyText),
      fill(t.msg_price, money),
      t.msg_start, // «Начальный номер: » — клиент допишет номер сам
      t.msg_file
    ].join('\n');
    var href = waUrl + encodeURIComponent(msg);

    next.href = href;
    // aria-disabled делает кнопку серой и некликабельной (стиль .btn[aria-disabled] в pages.css).
    next.toggleAttribute('aria-disabled', !ok);

    // 3.6. Нижняя панель на телефоне: тот же итог и та же ссылка.
    if (barTotal) barTotal.textContent = money;
    if (barOk) {
      barOk.href = href;
      barOk.toggleAttribute('aria-disabled', !ok);
    }

    // 3.7. Запоминаем выбор для кнопки «Назад» (store.set сам ловит ошибки приватного режима).
    store.set('sessionStorage', KEY, JSON.stringify(sel));
  }

  // ---- 4. События ---------------------------------------------------------------------

  // Нажатие на цену. Один обработчик на весь блок (делегирование событий):
  // closest('.price-btn') находит кнопку, даже если нажали на текст внутри неё.
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.price-btn');
    if (!b) return;
    sel = {
      kind: b.closest('.pk-table').getAttribute('data-kind'),
      copies: +b.getAttribute('data-copies'), // «+» превращает строку '3' в число 3
      q: +b.closest('tr').getAttribute('data-qty')
    };
    render();
  });

  // Смена вида (A5 ↔ шестёрки). По ТЗ §3: число листов сохраняем, а количество берём
  // ближайшее допустимое, не больше текущего. Пример: A5 · 4 → шестёрки · 2 (4 у шестёрок нет).
  root.addEventListener('change', function (e) {
    if (e.target.name !== 'kind') return;
    var k = e.target.value;
    var notAbove = qtys(k).filter(function (q) { return q <= sel.q; });
    sel = { kind: k, copies: sel.copies, q: notAbove.length ? notAbove[notAbove.length - 1] : qtys(k)[0] };
    render();
  });

  // ---- 5. Восстановление выбора -------------------------------------------------------
  // Читаем выбор из sessionStorage; если он испорчен или его нет — остаётся выбор по умолчанию.
  function restore() {
    try {
      var s = JSON.parse(store.get('sessionStorage', KEY));
      if (valid(s)) sel = s;
    } catch (err) { /* нет сохранённого выбора — оставляем по умолчанию */ }
    render();
  }

  // pageshow срабатывает и при обычной загрузке, и когда браузер достаёт страницу из кэша
  // по кнопке «Назад» (тогда обычный код ниже второй раз не выполняется).
  window.addEventListener('pageshow', function (e) { if (e.persisted) restore(); });
  restore();
})();
