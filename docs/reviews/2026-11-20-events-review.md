# Ревью «Печать для мероприятий» (/events), 2026-11-20, первый проход

Продукт: сайт PrintABC, страница «Печать для мероприятий» / «הדפסה לאירועים».
Диапазон: **11a3791..a2e89b4** (1 коммит: a2e89b4 «add events page»; 8 файлов, +1303/−2).
**Следующее ревью от: a2e89b4.**
Агенты: 4×Sonnet (git/сборка; цены; WhatsApp/тексты/доступность; вид/телефон) + судья Opus.
Эталоны: ТЗ v1.0 (`docs/events/tz.md`, 20.11), макет PR #12 (`design/mockup/{he,ru}/events.html`, `events.js`, стили `ev-*` в `pages.css`).
Тест-сайт = a2e89b4 [проверено агентом 1 и судьёй по HTML: 144 цены, скрипт и CSS-файлы совпадают; SHA сайт не показывает]. Скриншоты: `2026-11-20-events-img/`.
Не ошибки (решения 15–20.11): цена в браузере из `data-price`, inline JS, пустой `EventsModel`, ссылка `api.whatsapp.com/send/?phone=972508494172&text=`, нет сервера/API, нет строки НДС, только самовывоз, оплаты на сайте нет.

**Открыто: Б — 1 (Б1), В — 6 (В1–В6), М — 5 (М1–М5).** Из них 9 повторяют ошибки «Конвертов» (колонка «Конв.» в таблице).

## 1. Коротко

- Готовность примерно **70 %** [оценка]. Сборка 0 ошибок / 0 предупреждений. Все 144 цены совпадают с ТЗ §2, T01–T09 верны на he и ru (390 и 1366), консоль чистая. На компьютере страница рабочая.
- **Блокер Б1:** на телефоне нижняя панель зовёт «Рассчитать цену наклеек» и ведёт на /stickers, итога в ней нет. Это повтор Б1 «Конвертов»: общий `_BottomBar` с 17.11 не исправлен.
- **Новое, В1:** стили `ev-*` не перенесены в `wwwroot/css/pages.css` (нет нигде, проверено). Поэтому на телефоне «Ваш заказ» стоит под таблицей, столбец «2 стороны» уходит за край, а фото растягивается. Правка: скопировать 9 строк из макета.
- Повторы «Конвертов» один в один: иврит «15×10» (В2), «₪ 175» (В3), WhatsApp из ручных `%0a` с разрывом перед 📎 (В4), нет sessionStorage (В5), нет пункта меню ☰ (В6, плюс нет ссылки в футере).
- Правки «Конвертов» от 17.11 в код не попали: коммит их не трогает. Б1, В6 (меню), М1–М2 закрываются одной правкой общих файлов сразу для обеих страниц.

## 2. Что работает [проверено]

- Цены: 144 значения `data-price` = 8 таблицам ТЗ §2. Текст кнопки совпадает с `data-price`, лишних и пропущенных ячеек нет. Проверено скриптом судьи по `Events.cshtml` и агентом 2 по live he/ru. JS своих цен не хранит.
- Сценарии T01–T09 (he и ru × 390 и 1366, 36 из 36): итог совпадает с ценой в тексте WhatsApp. T07 (2 стороны, 350 → 15×15 → 250 г) = 432 ₪: тираж и стороны при смене вкладок сохраняются.
- Умолчание: 10×15 · 300 г · 1 сторона · 100 = 175 ₪. В видимой таблице ровно одна нажатая ячейка, итог в `<output aria-live="polite">`, подпись «вкл. НДС», строки НДС нет.
- Ссылка заказа: общая `WHATSAPP_URL` (`Utils/Helpers.cs:21`), не wa.me. Строки текста совпадают с §5, кроме В2–В4.
- Тексты §8 совпадают на обоих языках дословно (ключи свои, см. «Сняты»). Ключи he и ru совпадают (57/57), заглушек нет. Alt картинки на двух языках, `lang/dir` верные, свои `title`/`description`.
- Доступность: skip-link, `fieldset/legend` у размера и бумаги, настоящие radio со стрелками, видимый фокус (`a3-he-focus.png`), 8 `caption` с верным размером и бумагой, `th scope`, `aria-pressed` + `aria-label` у ячеек, Enter/Space выбирают ячейку, иконки `aria-hidden`.
- Нет `style=""`, нет `console.*`. `data-*` в инвариантной культуре (на /ru те же числа).
- Плитка на главной ведёт на `/events`. На `/ru/` `LocalizedAnchorTagHelper` сам даёт `/ru/events` (проверено на live). Хлебные крошки локализованы, правка `_Breadcrumbs` безопасна.
- Горизонтальной прокрутки страницы нет на 390/768/1024/1366 (he и ru).

## 3. Находки

| ID | Ур. | Что | Где | ТЗ | Конв. |
|---|---|---|---|---|---|
| Б1 | Б | Нижняя панель телефона ведёт на /stickers, итога нет | `Shared/_BottomBar.cshtml:2`, `_Layout.cshtml:32`, `Events.cshtml:4-11` | §3, §7 | повтор Б1 |
| В1 | В | Стили `ev-*` не перенесены: «Ваш заказ» под таблицей, таблица шире экрана, фото растянуто | `wwwroot/css/pages.css` (нет блока) | §3, CLAUDE §1 | новое |
| В2 | В | Иврит: размер виден как «15×10» | `Events.he.resx:123, 138-149` | §3, §5, §8 | повтор В1 |
| В3 | В | Иврит: нет LRM у цены, видно «₪ 175» | `Events.cshtml:706, 531`, 144 кнопки `:70-510` | §5 | повтор В2 |
| В4 | В | WhatsApp: ручные `%0a`, нет `encodeURIComponent`, разрыв перед 📎 | `Events.{he,ru}.resx:261`, `Events.cshtml:689-702` | §5, §9.1 | повтор В3 |
| В5 | В | «Назад» и перезагрузка не сохраняют выбор | `Events.cshtml:574-712` | §3, §4, §7 | повтор В4 |
| В6 | В | Нет пункта в меню ☰ и ссылки в футере | `Shared/_Header.cshtml:53-60`, `Shared/_Footer.cshtml:15` | §3, §7, §11.8 | меню — повтор В5 |
| М1 | М | «Вопрос?» ведёт на `wa.me`, а не на `WHATSAPP_URL` | `Events.cshtml:536` | §9.4 | повтор М5 |
| М2 | М | `scroll-padding-bottom: 16px` при панели 67 px | `wwwroot/css/base.css:15` | §3 | повтор М3 |
| М3 | М | `data-summary` / `data-kind-name` из макета заменены на `id`, нет `data-error` | `Events.cshtml:56, 530` | CLAUDE §1.3 | новое |
| М4 | М | Мусор: неиспользуемые `currentCulture/dir`, BOM; запасной выбор = первая ячейка (138 ₪) | `Events.cshtml:1, 8-10, 655, 666-672` | §4 | повтор М1, М6 |
| М5 | М | Фото без `width/height`, JPG без WebP | `Events.cshtml:20` | CLAUDE §5 | новое |

### Б — блокеры

**Б1. Нижняя панель телефона: «Рассчитать цену наклеек» → /stickers.** [проверено: код + live 390, he и ru, судья — Playwright]
- Что не так: `_BottomBar.cshtml:2` жёстко ставит `href="/stickers"` и `calculate_stickers`. `_Layout.cshtml:32` передаёт `ViewData["BottomBar"]`, но партиал его не читает, а Events его не задаёт. Live: he «חשבו מחיר למדבקות» → `/stickers`, ru «Рассчитать цену наклеек» → `/ru/stickers` (`a2-he-390-bottombar.png`). Итога и ссылки заказа в панели нет, а JS обновляет только `#ev-next`.
- Почему Б: на странице заказа главная кнопка телефона ведёт на другой продукт, это видит каждый покупатель с телефона. Агенты 2, 3 и 4 ставили Б, агент 1 ставил В. Та же ошибка открыта у конвертов (Б1 17.11) и у бухкнижек (Б5): чинится один раз в общем партиале.
- Как исправить (код из Б1 конвертов, уточнён: стрелка по языку, модель читается из `ViewData`, чтобы не зависеть от передачи `null` в `<partial model>`):
```csharp
// Utils/Helpers.cs (рядом с WHATSAPP_URL)
public record BottomBarModel(string Label, string Arrow);
```
```cshtml
@* Pages/Events.cshtml, в блоке @{ } вверху (Envelopes.cshtml, Pinkasim.cshtml — так же): *@
ViewData["BottomBar"] = new BottomBarModel(L["bar_order"].Value, isRtl ? "←" : "→");

@* Pages/Shared/_BottomBar.cshtml — строку 2 заменить: *@
@{ var bar = ViewData["BottomBar"] as PrintABC.Utils.BottomBarModel; }
<div class="bottom-bar">
@if (bar is not null)
{
    <div class="bottom-bar__price"><span class="bottom-bar__label">@L["total"]</span>
      <output class="bottom-bar__total" data-bar-total aria-live="polite">— ₪</output></div>
    <a class="btn btn--primary" data-bar-ok href="@WHATSAPP_URL" target="_blank" rel="noopener noreferrer">@bar.Label <span aria-hidden="true">@bar.Arrow</span></a>
}
else
{
    <a class="btn btn--primary" href="/stickers">@L["calculate_stickers"]</a>
    @* …иконки WhatsApp и телефона как сейчас… *@
}
</div>
```
```js
// Events.cshtml, к константам скрипта:
const barTotal = document.querySelector("[data-bar-total]");
const barOk = document.querySelector("[data-bar-ok]");
// в конце updateDisplayPrice():
if (barTotal) barTotal.textContent = money(sel.price);   // money() — см. В3
if (barOk) barOk.href = whatsappButton.href;
```
Ключи: `total` в `Resources/Pages/Shared/_BottomBar.{he,ru}.resx` («סה״כ» / «Итого»), `bar_order` в `Events.{he,ru}.resx` («להזמנה» / «Заказать»), как в макете `he/events.html:158`. Отступ снизу — М2.

### В — важно

**В1. Стили `ev-*` не перенесены в `wwwroot/css/pages.css`.** [проверено судьёй: grep по `wwwroot/css/*.css` и `Pages/` worktree — 0 правил `.ev-*`, scoped-CSS нет; live `pages.css`, `components.css`, `layout.css`, `PrintABC.styles.css` — 0; Playwright 390]
- Агент 4 прав (А4-2, А4-3). В макете блок `/* ---- Events printing ---- */`, `design/mockup/assets/css/pages.css:369-377`. Коммит CSS не трогает, а у конвертов (`99f307b`) такой блок перенесён (`wwwroot/css/pages.css:337-367`).
- Что видно на live 390 (he/ru): «Ваш заказ» на y=1947/2114, таблица на y=955/1016, то есть панель стоит под таблицей и под «Что входит». В макете она над таблицей. Таблица 480 px в обёртке 356 px, поэтому столбец «2 стороны» уходит за край и прокручивается внутри (`a4-site-he-390.png` против `a4-mock-he-390.png`). Фото 267 px вместо 200, пилюли бумаги в одну строку. На 1366 фото 525 px вместо 320.
- Уровень: агент 4 ставил Б. Судья ставит **В**: цена, заказ и ссылка верны, а нарушены вёрстка макета и §3 «Телефон: блок заказа над таблицей». Исправлять вместе с Б1, без этого телефонная версия не готова.
- Как исправить (дословно из макета, в конец `wwwroot/css/pages.css`):
```css
/* ---- Events printing (invitations & postcards) ---- */
.ev-hero { width: 100%; height: clamp(200px, 24vw, 320px); object-fit: cover; border-radius: 14px; }
.ev-size { padding: 10px 18px; border-radius: var(--r-md); min-height: 56px; }
.ev-paper { padding: 10px 18px; border-radius: var(--r-md); min-height: 56px; flex-direction: column; align-items: flex-start; gap: 2px; }
.ev-paper__name { font-weight: 700; }
.ev-paper__sub { font-size: 15px; color: var(--c-muted); }
.ev-table { min-width: 320px; }
.ev-table th[scope="col"] { width: 40%; }
.ev-table th[scope="col"]:first-child { width: 20%; }
@media (max-width: 767px) { #ev-calc .summary-panel { order: -1; } }
```

**В2. Иврит: размер виден как «15×10».** [проверено: `a3-he-tabs.png`, `a3-he-summary.png`; в he.resx 0 символов U+2066/U+2069]
- `tab_1…tab_4` = `10×15 ס״מ` без изоляции (`Events.he.resx:138-149`). Отсюда вкладки «15×10», «18×12», «10×21», заголовок «מחירון · 15×10», сводка «100 הזמנות 15×10 ס״מ», `caption` и строка «גודל:» в WhatsApp. `meta_description` (`:123`) тоже без изоляции, хотя §8 её требует.
- Уровень: агенты 2 и 3 ставили Б, агенты 1 и 4 — В. Судья ставит **В**, как В1 у конвертов: размер тот же, другой вкладки «15×10» нет, цена и заказ верны. Но это повтор после прямого замечания 17.11.
- Как исправить (`Events.he.resx`, в XML через ссылки на символы):
```xml
<data name="tab_1" xml:space="preserve"><value>&#x2066;10×15&#x2069; ס״מ</value></data>
<data name="tab_2" xml:space="preserve"><value>&#x2066;12×18&#x2069; ס״מ</value></data>
<data name="tab_3" xml:space="preserve"><value>&#x2066;15×15&#x2069; ס״מ</value></data>
<data name="tab_4" xml:space="preserve"><value>&#x2066;21×10&#x2069; ס״מ</value></data>
<data name="meta_description" xml:space="preserve"><value>הזמנות וגלויות &#x2066;10×15&#x2069;, &#x2066;12×18&#x2069;, &#x2066;15×15&#x2069;, &#x2066;21×10&#x2069; ס״מ על כרומו מט 250/300 גר׳, צד אחד או דו-צדדי, החל מ-50 יח׳, עד 3 ימי עבודה.</value></data>
```
Сводка, заголовок, caption и WhatsApp берут `tab_*`, поэтому исправятся сами.

**В3. Иврит: цена без LRM, видно «₪ 175».** [проверено: `a3-he-summary.png`; в коде и live нет U+200E]
- Затронуты итог (`Events.cshtml:706`, начальное значение `:531`), текст и `aria-label` 144 кнопок и строка «מחיר:» в WhatsApp. В макете кнопки записаны как `‎124 ₪‎`, итог как `t.lrm + N + ' ₪' + t.lrm` (`events.js:50`).
- Уровень: агент 3 ставил Б, остальные — В. Судья ставит **В**, как В2 у конвертов.
- Как исправить:
```js
const LRM = "‎";
const isRtl = document.documentElement.dir === "rtl";
function money(p) { return isRtl ? LRM + p + " ₪" + LRM : p + " ₪"; }
totalPrice.textContent = money(sel.price);          // строка 706
```
```cshtml
@functions { static string Money(int p) => "‎" + p + " ₪‎"; }
@* :531 *@ <output class="price-box__total" id="ev-total" aria-live="polite">@Money(175)</output>
@* 144 кнопки — заменой по регулярке в VS: «>(\d+) ₪</button>» → «>@Money($1)</button>»,
   «· (\d+) ₪"» → «· @Money($1)"» *@
```
На /ru LRM невидим и ничего не меняет. Цену в WhatsApp подставлять как `money(sel.price)`, а `₪` убрать из шаблона (см. В4).

**В4. Текст WhatsApp собран из ручных `%0a`.** [проверено: resx + код + раскодированный href на live he/ru, судья — Playwright]
- `whatsapp_template` (he и ru, `:261`) — одна строка, где каждая часть кончается на `%0a` и настоящий перевод строки. `updateWhatsappLink` склеивает `whatsappUrl + template` без `encodeURIComponent` (`Events.cshtml:701`). Работает случайно: браузер выкидывает LF из URL и сам кодирует пробелы и иврит, но любой `&`, `#` или `+` в тексте обрежет сообщение. Что приходит клиенту:
```text
…מחיר: 175 ₪ כולל מע״מ
את קובץ ההדפסה אשלח מיד דרך ␠
📎 ← "מסמך" (לא "גלריה").
```
  На ru так же: «…через ␠\n📎 → «Документ»…». В §5 это одна строка. Двойных пустых строк у получателя нет: агент 1 видел их в `getAttribute`, но при переходе браузер удаляет LF. Остальные строки и цена верны.
- Уровень: агент 3 ставил Б, агенты 1 и 2 — В. Судья ставит **В**, как В3 у конвертов: текст читаемый, цена верная.
- Как исправить: в resx 7 строк без `%0a`, без отступов, `₪` перенести в `money()`:
```text
he: שלום! אני רוצה להזמין הדפסת הזמנות/גלויות.
    גודל: {size}
    נייר: כרומו מט {paper} גר׳
    הדפסה: {sides}
    כמות: {qty} יח׳
    מחיר: {price} כולל מע״מ
    את קובץ ההדפסה אשלח מיד דרך 📎 ← "מסמך" (לא "גלריה").
ru: …  Цена: {price} с НДС
    Файл для печати пришлю следом через 📎 → «Документ» (не «Галерея»).
```
```js
function updateWhatsappLink(sel) {
    let text = messageTemplate.value.replace(/\r\n?/g, "\n").trim();
    const data = { size: sizeTexts[sel.size].value, paper: sel.paper,
                   sides: sidesTexts[sel.sides].value, qty: sel.qty, price: money(sel.price) };
    for (const [key, value] of Object.entries(data)) text = text.replaceAll(`{${key}}`, value);
    whatsappButton.href = whatsappUrl + encodeURIComponent(text);
}
```
Ссылка панели (Б1) берёт тот же `whatsappButton.href`.

**В5. Выбор не переживает «Назад» и перезагрузку.** [проверено: в коде 0 вхождений `sessionStorage`/`pageshow`; live: выбор 300 шт./2 стороны → reload → снова 175 ₪, he и ru; агент 3: 21×10/2/400 → / → «Назад» → 175 ₪]
- ТЗ §3, §4, приёмка §7. Образец — макет `events.js:13, 28, 62, 78-83` и код В4 конвертов.
- Как исправить (`Events.cshtml`, заменить строку 711 `switchTable(getCheckedSize(), getCheckedPaper());`):
```js
const KEY = "printabc-events";                                   // ключ макета
function defaultBtn() { return getTable("a", "300").querySelector('tr[data-qty="100"] .price-btn[data-sides="1"]'); }
function findBtn(s) {
    if (!s || !["a", "b", "c", "d"].includes(s.size) || !["250", "300"].includes(String(s.paper))) return null;
    const sides = s.sides === "2" ? "2" : "1";
    return getTable(s.size, String(s.paper))
        .querySelector(`tr[data-qty="${Number(s.qty)}"] .price-btn[data-sides="${sides}"]`);
}
function restore() {
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { }
    const btn = findBtn(saved) || defaultBtn();                  // неизвестное значение → умолчание (ТЗ §4)
    const t = btn.closest(".ev-table");
    document.querySelector(`#ev-calc input[name="size"][value="${t.dataset.size}"]`).checked = true;
    document.querySelector(`#ev-calc input[name="paper"][value="${t.dataset.paper}"]`).checked = true;
    activeTable = t;
    selectButton(btn);
    switchTable(t.dataset.size, t.dataset.paper);                // таблица, заголовок, итог, ссылка
}
restore();
window.addEventListener("pageshow", e => { if (e.persisted) restore(); });
```
Сохранять в конце `updateDisplayPrice()`:
`try { sessionStorage.setItem(KEY, JSON.stringify({ size: sel.size, paper: sel.paper, sides: sel.sides, qty: sel.qty })); } catch (e) { }`

**В6. Нет пункта «Печать для мероприятий» в меню ☰ и в футере.** [проверено: код; live 390 — в `#mobile-menu` и `.site-footer` нет ссылок на `/events`]
- Меню (`_Header.cshtml:54-56`): только наклейки, визитки, каталоги. В макете (`he/events.html:45-50`) идут ещё бухкнижки, конверты и события (`aria-current="page"`). ТЗ §3 и §11.8: пункт после «Конвертов», приёмка §7: «меню ведёт на /events и /ru/events». Это повтор В5 конвертов (и В4 бухкнижек): меню с тех пор не трогали.
- Футер (`_Footer.cshtml:15`): на месте событий стоит заглушка `<a href="#">@L["branding"]</a>` («מיתוג ודפוס לאירועים» / «Брендинг и печать для мероприятий»). В макете (`he/events.html:143`) здесь «הדפסה לאירועים» → events.
- Как исправить:
```cshtml
@* _Header.cshtml, после строки 56 (/catalogs): *@
<a href="/pinkasim">@L["pinkasim"]</a>
<a href="/envelopes">@L["envelopes"]</a>
<a href="/events">@L["events"]</a>

@* _Footer.cshtml:15 — заменить заглушку: *@
<a href="/events">@L["events"]</a>
```
Ключи: в `_Header.{he,ru}.resx` — `pinkasim`, `envelopes`, `events` («פנקסים», «מעטפות», «הדפסה לאירועים» / «Бухгалтерские книжки», «Конверты», «Печать для мероприятий»). В `_Footer.{he,ru}.resx` — `events`, ключ `branding` удалить. Префикс /ru подставит `LocalizedAnchorTagHelper`.

### М — мелочи

- **М1.** `Events.cshtml:536` — «Вопрос?» ведёт на `https://wa.me/…`, а в макете и §9.4 стоит общая ссылка. Исправить: `href="@WHATSAPP_URL"`. Иконки `wa.me` в `_BottomBar`/`_Header` — старый общий код, не этого коммита. Агент 3 ставил В, судья понизил до М, как у конвертов.
- **М2.** `base.css:15` задаёт `scroll-padding-bottom: 16px`, а панель на ≤767 px высотой 67 px, поэтому фокус может уйти под неё. §3 требует отступ не меньше панели, но в макете тот же недочёт. Исправить без чисел вне токенов: `@media (max-width: 767px) { html { scroll-padding-bottom: calc(var(--bar-h) + 16px); } }` (`--bar-h` уже есть в `tokens.css:58`).
- **М3.** `data-summary` и `data-kind-name` из макета заменены на `id="ev-sum-text"` (`:530`) и `id="ev-kind-name"` (`:56`). Блока ошибки `data-error` нет. CSS на них не завязан, поэтому М, но CLAUDE §1.3 просит не переименовывать. Вернуть атрибуты макета при правках В3–В5.
- **М4.** Удалить неиспользуемые `currentCulture` и `dir` (`:8-10`), `isRtl` пригодится для Б1. Убрать BOM в начале `Events.cshtml`. `getSelection()` (`:666-672`) и `switchTable` (`|| rows[0]`, `:655`) при пустом выборе берут первую ячейку (50 шт., 138 ₪), а не умолчание. Сейчас этот код недостижим, после В5 заменить на `defaultBtn()`.
- **М5.** `Events.cshtml:20` — у `<img class="ev-hero">` нет `width`/`height`, картинка в JPG без WebP/`srcset` (CLAUDE §5). В макете так же, а после В1 высота фиксирована CSS, поэтому CLS малый. Добавить `width="1200" height="800"` (по реальному файлу) и WebP при оптимизации картинок.

Сняты судьёй:
- А3-09 «плитка на главной без /ru» — ложная: `LocalizedAnchorTagHelper` на `/ru/` даёт `href="/ru/events"` (live).
- hreflang/canonical (А1-10, А3-07) — общий недочёт `_Layout`, а не этой страницы. Он открыт как В7 в ревью бухкнижек 15.11 и здесь не считается.
- «Срок / до 3 рабочих дней» (А3-11) совпадает с макетом (`ev_lead_l`/`ev_lead`) и с §3. С ключом `lead` §8 («Готовность до 3 рабочих дней») расходится сам документ, это правка ТЗ, а не кода (так же снято у конвертов).
- Имена ключей resx не как в §8 (А3-10): значения совпадают дословно, ключи внутренние, у конвертов не считалось.
- `aria-pressed="true"` в скрытых таблицах (А2-6): `hidden` скринридер не читает.
- «100 הזמנות…» (А2-7): дословно формат §8, иврит проверяет носитель языка.
- «₪» и «·» в разметке (А3-12), `aria-live` только у итога (А3-13), «175 ₪» в `<output>` до JS (А1-8): как в макете или закрывается В3.

Порядок правок: Б1 + В1 (телефон), затем В2–В4 (иврит и WhatsApp, всё в resx и `updateWhatsappLink`), затем В5, В6. Б1, В6 (меню), М1, М2 делаются в общих файлах и закрывают те же пункты у конвертов и бухкнижек.

## 4. Вопросы владельцу

Нет.

Без владельца, для треда страницы: привести ключ `lead` в ТЗ §8 к макету (подпись «Срок» + значение «до 3 рабочих дней»). Кроме того, в `CLAUDE.md` для `/events` до сих пор написано «v0.9.1, цены ещё не заданы», хотя действует v1.0.

## 5. Не проверено

- Как WhatsApp на телефоне показывает размер и цену на иврите после правок В2–В4. Проверено только в браузере (раскодированный href).
- Ширина 1024 при T01–T09: агенты гоняли 390 и 1366, на 1024 только замеры вёрстки.
- Lighthouse, скринридер, Safari и Firefox.
- Реальный фокус под нижней панелью на сенсорном устройстве (М2 оценён по CSS).
- Точный SHA тест-сайта: он совпадает с a2e89b4 по HTML и CSS.
- Вид после переноса CSS из В1: строки взяты из макета дословно, но после правки не смотрели.
