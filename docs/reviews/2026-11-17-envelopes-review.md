# Ревью «Конверты» (/envelopes), 2026-11-17, первый проход

Продукт: сайт PrintABC, страница «Конверты» / «מעטפות».
Диапазон: **d1f8bc0..11a3791** (2 коммита: 99f307b, 11a3791; 10 файлов, +869/−4).
**Следующее ревью от: 11a3791.**
Агенты: 4×Sonnet (git/сборка; цены; WhatsApp/тексты/доступность; вид/телефон) + судья Opus.
Эталоны: ТЗ v1.0.1 (`tz-envelopes.md`, 16.11), макет PR #11 (`design/mockup/{he,ru}/envelopes.html`, `envelopes.js`, `env-*`).
Тест-сайт = 11a3791 [проверено агентом 1 по HTML: разметка, 22 цены и скрипт совпадают; SHA сайт не показывает]. Скриншоты: `docs/reviews/2026-11-17-envelopes-img/`.
Не ошибки (решения 15–16.11): цена в браузере из `data-price`, inline JS, пустой `EnvelopesModel`, ссылка `api.whatsapp.com/send/?phone=972508494172&text=`, нет сервера/API, нет строки НДС, только самовывоз.

**Открыто: Б — 1 (Б1), В — 5 (В1–В5), М — 6 (М1–М6).**

## 1. Коротко

- Готовность примерно **75 %** [оценка]. Сборка 0 ошибок / 0 предупреждений. Все 22 цены совпадают с ТЗ §2, T01–T08 верны на he и ru, консоль чистая.
- **Блокер Б1:** на телефоне нижняя панель на странице конвертов зовёт «Рассчитать цену наклеек» и ведёт на /stickers. Итога в панели нет. Тот же недочёт был у бухкнижек (Б5).
- Иврит: размер виден задом наперёд, «23×11» (В1), а ₪ стоит слева от числа: «₪ 200» (В2).
- WhatsApp: ссылка рабочая, цена верная, но шаблон собран из ручных `%0a`, и строка про 📎 разорвана (В3).
- Не сделаны: «Назад» через sessionStorage (В4) и пункт меню ☰ (В5).

## 2. Что работает [проверено]

- Цены: 22 значения `data-price` = ТЗ §2 (`Envelopes.cshtml:44-119`). JS своих цен не хранит. T01–T08 на he и ru при ширинах 390 и 1280 дают итог = цене в тексте WhatsApp. T08 (250 → 24×34) даёт 100 шт., печать сохраняется.
- Умолчание: 11×23, ч/б, 500 = 200 ₪, строка и ячейка подсвечены. Выбрана ровно одна ячейка (`aria-pressed`). Итог стоит в `<output aria-live="polite">`. Подпись «вкл. НДС», строки НДС нет.
- Вкладки размера: radio в fieldset/legend, стрелки работают (he и ru). Фокус виден (`a3-he-focus.png`, `a3-ru-tabs-focus.png`).
- Тексты §8 совпадают на обоих языках, кроме М4. В JS нет слов, заглушек `[ ]` и `{…}` в готовом тексте нет, ключи he и ru совпадают. Alt картинки на двух языках, lang/dir верные.
- Навигация: плитка на главной и ссылка в футере ведут на `/envelopes` и `/ru/envelopes`. Хлебные крошки локализованы.
- Вид совпадает с макетом: на ≤767 «Ваш заказ» стоит над таблицей, на ≥768 панель sticky. Горизонтальной прокрутки нет на 390/768/1024/1366, таблица на 390 не обрезана (`live-he-390.png`, `live-ru-1366.png`).
- Попутная правка `Pinkasim.he.resx` (убрана « .» в конце текста WhatsApp) безопасна.

## 3. Находки

| ID | Ур. | Что | Где | ТЗ |
|---|---|---|---|---|
| Б1 | Б | Нижняя панель телефона ведёт на /stickers, итога нет | `Shared/_BottomBar.cshtml:2`, `_Layout.cshtml:32` | §3, §7 |
| В1 | В | Иврит: размер отображается «23×11» | `Envelopes.he.resx:135-141` | v1.0.1, §5 |
| В2 | В | Иврит: нет LRM вокруг цены, видно «₪ 200» | `Envelopes.cshtml:293`, `:44-119`, `he.resx:131` | §5 |
| В3 | В | WhatsApp: ручные `%0a`, нет `encodeURIComponent`, разрыв перед 📎 | `Envelopes.{he,ru}.resx:127-132`, `Envelopes.cshtml:277-289` | §5 |
| В4 | В | «Назад» и перезагрузка не сохраняют выбор | `Envelopes.cshtml:179-299` | §3, §7 |
| В5 | В | В меню ☰ нет «Конвертов» | `Shared/_Header.cshtml:53-60` | §3, §7 |
| М1 | М | Запасной выбор берёт первую ячейку (120 ₪), а не 500/ч/б | `Envelopes.cshtml:247, 258-260` | §4 |
| М2 | М | Скрытый caption таблицы 24×34 читается как «18×25» | `Envelopes.cshtml:97` | §3 |
| М3 | М | `scroll-padding-bottom: 16px` при панели высотой 67 px | `wwwroot/css/base.css:15` | §3 |
| М4 | М | ru: «Требования к макету» вместо «Требования к файлу» | `Envelopes.ru.resx:225` | §8 |
| М5 | М | «Вопрос?» ведёт на `wa.me`, а не на общую `WHATSAPP_URL` | `Envelopes.cshtml:144` | §9.4 |
| М6 | М | Мусор: неиспользуемые `currentCulture/isRtl/dir`, пробел после `incl_4`, BOM | `Envelopes.cshtml:1, 8-10, 131` | — |

### Б — блокеры

**Б1. Нижняя панель телефона: «Рассчитать цену наклеек» → /stickers.** [проверено: код + live 390, he и ru]
- Что не так: `_BottomBar.cshtml:2` жёстко задаёт `href="/stickers"` и `calculate_stickers`. `_Layout.cshtml:32` передаёт в партиал `ViewData["BottomBar"]`, но партиал его не использует, а Envelopes его не задаёт. После выбора 24×34/цвет/1000 панель не меняется (`live-ru-390-L1000.png`, `live-he-390.png`).
- Почему Б: на основной странице заказа с телефона главная кнопка ведёт на другой продукт. Это неверная ссылка, её видит каждый покупатель с телефона. Уровень тот же, что у бухкнижек (Б5).
- Как исправить:
```cshtml
@* Utils/Helpers.cs (или Models): *@
public record BottomBarModel(string Label);

@* Pages/Envelopes.cshtml, в блоке @{ } вверху: *@
ViewData["BottomBar"] = new BottomBarModel(L["bar_order"]);   // he «להזמנה», ru «Заказать»

@* Pages/Shared/_BottomBar.cshtml:2 — вместо жёсткой ссылки: *@
@model BottomBarModel?
<div class="bottom-bar">
@if (Model != null) {
    <div class="bottom-bar__price"><span class="bottom-bar__label">@L["total"]</span>
      <output class="bottom-bar__total" data-bar-total aria-live="polite">— ₪</output></div>
    <a class="btn btn--primary" data-bar-ok href="@WHATSAPP_URL" target="_blank" rel="noopener noreferrer">@Model.Label <span aria-hidden="true">→</span></a>
} else {
    <a class="btn btn--primary" href="/stickers">@L["calculate_stickers"]</a>
}
  … иконки WhatsApp/тел. как сейчас …
</div>
```
```js
// Envelopes.cshtml, в updateDisplayPrice() после updateWhatsappLink(sel):
const barTotal = document.querySelector("[data-bar-total]");
const barOk = document.querySelector("[data-bar-ok]");
if (barTotal) barTotal.textContent = money(sel.price);   // money() — см. В2
if (barOk) barOk.href = whatsappButton.href;
```
Стрелку в he взять из resx («←»), ключи `total`/`bar_order` добавить в `_BottomBar.{he,ru}.resx`. Отступ снизу — М3.

### В — важно

**В1. Иврит: размер виден как «23×11».** [проверено по координатам глифов, live 1366]
- В he-вкладке «11» стоит на x=1251, «23» на x=1226, то есть «11» правее и визуально читается «23×11». То же в заголовке «מחירון · …» (11: x=1085, 23: x=999) и в сводке «Ваш заказ» (11: x=363, 23: x=335). На ru порядок верный. В тексте WhatsApp та же строка без изоляции. Скриншот: `a3-he-calc-default.png`.
- Уровень: агенты 3 и 4 поставили Б. Судья ставит **В**: цена и сам заказ верны, речь об одном и том же конверте, а правка — 3 строки resx. Исправить в первую очередь, потому что это нарушает прямое правило ТЗ v1.0.1.
- Как исправить (`Envelopes.he.resx:135-141`, в XML можно писать ссылками на символы):
```xml
<data name="tab_s" xml:space="preserve"><value>&#x2066;11×23&#x2069; ס״מ</value></data>
<data name="tab_m" xml:space="preserve"><value>&#x2066;18×25&#x2069; ס״מ</value></data>
<data name="tab_l" xml:space="preserve"><value>&#x2066;24×34&#x2069; ס״מ</value></data>
```
Сводка, заголовок и WhatsApp берут `tab_*`, поэтому исправятся сами. `meta_description` не трогать.

**В2. Иврит: цена без LRM, видно «₪ 200».** [проверено: в итоге ₪ x=134 левее числа x=183; U+200E нет нигде]
- Затронуты итог (`:293`), текст 22 кнопок и их aria-label (`:44-119`) и строка «מחיר:» в WhatsApp (`he.resx:131`). В макете цена записана как `lrm + price + ' ₪' + lrm`.
- Как исправить:
```js
const LRM = "‎";
const isRtl = document.documentElement.dir === "rtl";
function money(p) { return isRtl ? LRM + p + " ₪" + LRM : p + " ₪"; }
totalPrice.textContent = money(sel.price);          // строка 293
// в updateWhatsappLink: price: money(sel.price), а в he.resx: «מחיר: {price} כולל מע״מ» (без своего ₪)
```
```cshtml
@functions { static string Money(int p) => "‎" + p + " ₪‎"; }
<button … aria-label="100 @L["unit"] · @L["bw"] · @Money(120)">@Money(120)</button>
```
На /ru символ LRM невидим и ничего не меняет. Начальное `200 ₪` в `<output>` (`:139`) тоже заменить на `@Money(200)`.

**В3. Текст WhatsApp собран из ручных `%0a`.** [проверено: код + раскодированный href на live]
- Каждая строка `whatsapp_template` (he и ru, `:127-132`) кончается на `%0a` и настоящий перевод строки (CRLF). `updateWhatsappLink` склеивает `whatsappUrl + template` без `encodeURIComponent` (`:288`). Ссылка работает случайно: браузер выкидывает CR/LF из URL и сам кодирует иврит. Что приходит клиенту:
```text
…מחיר: 200 ₪ כולל מע״מ
את קובץ ההדפסה אשלח מיד דרך ␠
📎 ← "מסמך" (לא "גלריה").
```
  Последняя строка разорвана перед 📎, и в конце остаётся лишний пробел. На ru так же: «…через ␠\n📎 → «Документ»…». В ТЗ §5 это одна строка. Цены и подстановки верны, литералов `{…}` нет. Агент 4 писал «без %0a», это неверно. Агент 1 ставил Б, судья ставит **В**: текст читаемый, цена верная.
- Как исправить: в resx — 6 строк без `%0a`, последняя целиком «…דרך 📎 ← "מסמך" (לא "גלריה").» / «…через 📎 → «Документ» (не «Галерея»).». В JS:
```js
function updateWhatsappLink(sel) {
    let text = messageTemplate.value.replace(/\r\n/g, "\n").trim();
    const data = { size: sizeTexts[sel.size].value, print: printTexts[sel.print].value,
                   qty: sel.qty, price: money(sel.price) };
    for (const [key, value] of Object.entries(data)) text = text.replaceAll(`{${key}}`, value);
    whatsappButton.href = whatsappUrl + encodeURIComponent(text);
}
```

**В4. Выбор не переживает «Назад» и перезагрузку.** [проверено: в коде 0 вхождений `sessionStorage`/`pageshow`; на live 18×25/цвет/1000 → уход на / → «Назад» → снова 11×23/ч/б/500]
- ТЗ §3 и приёмка §7. Образец — макет `envelopes.js:62-82`.
- Как исправить (`Envelopes.cshtml`, заменить строку 298 `switchSize(getCheckedSize());`):
```js
const KEY = "env-sel";
function defaultBtn() { return getTable("s").querySelector('tr[data-qty="500"] .price-btn[data-print="bw"]'); }
function findBtn(s) {
    if (!s || !["s", "m", "l"].includes(s.size)) return null;
    const print = s.print === "c" ? "c" : "bw";
    return getTable(s.size).querySelector(`tr[data-qty="${Number(s.qty)}"] .price-btn[data-print="${print}"]`);
}
function restore() {
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { }
    const btn = findBtn(saved) || defaultBtn();          // неизвестное значение → умолчание (ТЗ §4)
    const size = btn.closest(".env-table").dataset.size;
    document.querySelector(`#env-calc input[name="size"][value="${size}"]`).checked = true;
    tables.forEach(t => t.hidden = t.dataset.size !== size);
    activeTable = getTable(size);
    selectButton(btn);
    sizeName.textContent = sizeTexts[size].value;
    updateDisplayPrice();
}
restore();
window.addEventListener("pageshow", e => { if (e.persisted) restore(); });
```
Сохранять в конце `updateDisplayPrice()`:
`try { sessionStorage.setItem(KEY, JSON.stringify({ size: sel.size, print: sel.print, qty: sel.qty })); } catch (e) { }`

**В5. В меню ☰ нет «Конвертов».** [проверено: live 390, `live-he-390-menu.png`, `live-ru-390-menu.png`]
- В меню только наклейки, визитки и каталоги (`_Header.cshtml:54-56`). По ТЗ §3 пункт ставится после «Бухгалтерских книжек», которых в меню тоже нет (это В4 ревью 15.11).
- Как исправить (`_Header.cshtml`, после строки 56):
```cshtml
<a href="/pinkasim">@L["pinkasim"]</a>
<a href="/envelopes">@L["envelopes"]</a>
```
Добавить ключи в `Resources/Pages/Shared/_Header.{he,ru}.resx`: «פנקסים»/«Бухгалтерские книжки», «מעטפות»/«Конверты». Префикс /ru подставит `LocalizedAnchorTagHelper`.

### М — мелочи

- **М1.** `getSelection()` (`:258-260`) при пустом выборе берёт первую ячейку: проверено вызовом на live, результат 120 ₪ вместо 200. `switchSize` (`:247`) делает то же через `|| rows[0]`. Сейчас код недостижим, поэтому М. После В4 он оживёт: заменить на `defaultBtn()` из В4.
- **М2.** `:97` — caption таблицы 24×34 использует `L["tab_m"]`, и скринридер читает «מחירון · 18×25». Видимый h2 верный. Исправить на `L["tab_l"]`.
- **М3.** `base.css:15` задаёт `scroll-padding-bottom: 16px`, а панель на ≤767 высотой 67 px, поэтому фокус может уйти под неё. В макете тот же недочёт, поэтому не выше М. Исправить: `@media (max-width:767px){ html{ scroll-padding-bottom: calc(67px + 16px); } }`.
- **М4.** `Envelopes.ru.resx:225` — «Требования к макету», а по §8 и макету «Требования к файлу».
- **М5.** `:144` — «Вопрос?» ведёт на `https://wa.me/…`, а в макете и §9.4 общая ссылка. Исправить: `href="@WHATSAPP_URL"`.
- **М6.** Удалить неиспользуемые `currentCulture/isRtl/dir` (`:8-10`), убрать пробел в `<span>@L["incl_4"] </span>` (`:131`) и BOM в начале файла.

Сняты судьёй: «Срок / до 3 рабочих дней» (совпадает с макетом), «Ч/б» с заглавной в aria-label (это `col_bw` из §8), «₪» в разметке ячеек (цены в разметке по ТЗ §2), aria-label языков в `_Header` (старый код, вне диапазона). «Вопрос?» понижен из В в М. hreflang (`_Layout`) — общий недочёт, он уже открыт как В7 в ревью бухкнижек и здесь не считается.

## 4. Вопросы владельцу

Нет.

## 5. Не проверено

- Как WhatsApp на телефоне показывает размер и цену на иврите после правок В1/В2. Проверено только в браузере.
- Реальный фокус клавиатурой под нижней панелью на сенсорном устройстве (М3 оценён по CSS). Safari и Firefox не проверялись.
- Enter/Space на ячейках не прогонялись: это стандартные `<button>`.
- Точный SHA тест-сайта: он совпадает с 11a3791 по HTML.
- Внешний вид других страниц после правки `pages.css`: изменения точечные, но визуально не смотрели.
