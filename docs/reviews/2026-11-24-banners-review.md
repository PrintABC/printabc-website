# Ревью «Баннеры» (/banners), 2026-11-24, первый проход

Продукт: сайт PrintABC, страница «Баннеры» / «שמשונית».
Диапазон: **313ba28..75e25a3** (1 коммит: 75e25a3 «add banners page with functionality», master2080, 24.11; 8 файлов, +1001/−1).
**Следующее ревью от: 75e25a3.**
Агенты: 4×Sonnet (A1 git/сборка; A2 цены и сценарии; A3 тексты/WhatsApp/доступность; A4 вид/телефон) + судья Opus.
Эталоны: ТЗ v1.0.1 (`docs/banners/tz.md` = `/mnt/project-files/banners/tz-banners.md`), макет PR #15 (ветка `claude/project-thread-rrsoja`, efde15c: `design/mockup/{he,ru}/banners.html`, `banners.js`, стили `bn-*` в `pages.css:395-410`).
Где проверяли: Azure без /banners (404), поэтому всё на локальном сайте `localhost:5211` = 75e25a3. Судья пересобрал `--no-incremental` в отдельную папку: 0 предупреждений / 0 ошибок. Скриншоты: `2026-11-24-banners-img/` (агенты `a2-…a4-…`, судья `j-…`).
Не ошибки (решения 15.11): цена в браузере, inline JS, пустой `BannersModel`, `WHATSAPP_URL` = `api.whatsapp.com/send/?phone=972508494172&text=`, нет сервера/API, нет строки НДС, только самовывоз, оплаты на сайте нет.

**Открыто: Б — 1 (Б1), В — 5 (В1–В5), М — 6 (М1–М6).** 10 из 12 — повторы ролл-апов 22.11 (и конвертов 17.11 / мероприятий 20.11), хотя ТЗ §9.7 прямо просит их не повторять.

## 1. Коротко

- Готовность примерно **70 %** [оценка]. Сильная часть сделана хорошо: формула целочисленная, ставки из `data-*`, T01–T17e и T20 проходят на he/ru × 390/1366, перебор 35 802 расчётов против эталона — 0 расхождений (A2). Тексты §8 совпадают. Вёрстка `bn-*` перенесена из макета один в один, телефон 390 и порядок блоков как в макете, горизонтальной прокрутки нет. Консоль чистая.
- **Блокер Б1** (четвёртый раз подряд): на телефоне нижняя панель — «Рассчитать цену наклеек» → `/stickers`, итога нет, на ошибке не гаснет. Общий `_BottomBar` после 22.11 не трогали.
- Остальное — те же повторы: иврит видит «₪ 165» (В1, LRM), WhatsApp на ручных `%0a` без `encodeURIComponent` и с разрывом перед 📎 (В2), нет `sessionStorage` — «Назад»/F5 сбрасывают введённый размер (В3), нет пункта в ☰ (В4). Новое: ссылка «Баннеры» в футере `href="#"`, he «באנרים» (В5).
- После 22.11 разработчик сделал одну правку по ревью: a332f92 добавил стили `ru-*` — но в `base.css`, а не в `pages.css`; баннеры повторили это (М3). Общие файлы (`_BottomBar`, `_Header`, `_Footer`, `Helpers.cs`) не менялись — правки из «Правок общих файлов» 22.11 закрыли бы Б1, В4, М1, М2 сразу на 5 страницах.

## 2. Что работает [проверено]

- Сборка: 0 Warning(s), 0 Error(s) (судья и A1). Тестового проекта нет, §7 — ручные сценарии.
- Цены (§2): ставки 110/1/30/20/1.18 в `data-*` `#bn-calc`, `V = Math.round(1.18*100)`, `⌊(X+500000)/1000000⌋`, порог 10 000 см² константой, `Math.round` к цене не применяется. T01 165, T02 130, T04 319, T11 319/638, T20 325 — у судьи live he/ru 390 совпали с A2.
- Проверка ввода: порядок `err_int → err_min → err_max` (T17e 49×300 → err_min), текст по `change/blur`, пересчёт и «—» по `input`, одна строка ошибки под парой полей, `aria-invalid` у нужных полей, при `err_max` у обоих + ссылка `wa_big` с введёнными числами. На ошибке у «Заказать» нет `href`, `aria-disabled="true"`.
- Тексты §8 he/ru дословно (58/58 ключей, наборы совпадают, заглушек нет), «שמשונית», «טבעות», размер в LRI/PDI (`⁦100×70⁩`) в подзаголовке, сводке, file_2, WhatsApp и `wa_big`. Площадь he «0.70», ru «0,70», усечение до 2 знаков. Крошки «דף הבית / שמשונית», «Главная / Баннеры». `title`/`description` по §8, `<html lang dir>` верные.
- Доступность: skip-link, `label for` у 3 полей, 2 `fieldset/legend`, настоящие radio со стрелками, видимый фокус, `<output aria-live="polite">`, svg `aria-hidden`, `style=""` нет.
- Вид: стили `bn-*` (`base.css:208-266`) по значениям = макет `pages.css:395-410`; фото, поля, кнопки обработки ±2 px к макету на 390/768/1024/1366; he «ширина» справа и первой; sticky «Ваш заказ» на десктопе, на 390 он сразу под формой. Прокрутки нет на 390/768/1024/1366.
- Плитка на главной ведёт на `/banners` и `/ru/banners`.

## 3. Находки

| ID | Ур. | Что | Где | ТЗ | Повтор |
|---|---|---|---|---|---|
| Б1 | Б | Нижняя панель телефона: «Рассчитать цену наклеек» → /stickers, итога нет, на ошибке активна | `Shared/_BottomBar.cshtml:2`, `Banners.cshtml:4-11` | §3, §7 | ролл. Б1, мер. Б1, конв. Б1 |
| В1 | В | Иврит: цена без LRM, на экране «₪ 165» (итог, цена за шт., WhatsApp, подзаголовок, meta) | `Banners.cshtml:67-68, 314-315`, `Banners.he.resx:123,129,288,291` | §3, §5, §7, §8 | ролл. В2, мер. В3, конв. В2 |
| В2 | В | WhatsApp: ручные `%0a` + перевод строки в resx, нет `encodeURIComponent`, разрыв перед 📎, нет ключей `wa_*` §8; `wa_more`/`wa_big` без кодирования | `Banners.{he,ru}.resx:273-291`, `Banners.cshtml:49, 261, 272-294` | §5, §8, §9.1 | ролл. В3+М4, мер. В4, конв. В3 |
| В3 | В | Нет `sessionStorage`/`pageshow`: «Назад» и F5 сбрасывают на 100×70 (T18, T18b, T18c) | `Banners.cshtml:110-321` | §3, §7 | ролл. В4, мер. В5, конв. В4 |
| В4 | В | Нет пункта «שמשונית/Баннеры» в ☰ (и «Ролл-апы», и ещё трёх) | `Shared/_Header.cshtml:54-56` | §3, §7 | ролл. В5, мер. В6, конв. В5 |
| В5 | В | Футер: «Баннеры» `href="#"`, he подпись «באנרים» вместо «שמשונית» | `Shared/_Footer.cshtml:20`, `_Footer.he.resx:127` | §3, §7 | новое (как ролл. М3, мер. В6) |
| М1 | М | «Вопрос?» ведёт на `wa.me`, а не на `WHATSAPP_URL` | `Banners.cshtml:73` | §3, §7, §9.4 | ролл. М1, мер. М1, конв. М5 |
| М2 | М | `scroll-padding-bottom: 16px` при панели 72 px | `wwwroot/css/base.css:15` | §3 | ролл. М2, мер. М2, конв. М3 |
| М3 | М | Стили `bn-*` в `base.css`, а не в `pages.css` | `wwwroot/css/base.css:208-266` | §9.6, CLAUDE §1.4 | ролл. В1 (a332f92 тоже в base.css) |
| М4 | М | До JS: сводка и площадь пустые, «Заказать» `href="#"`, «165 ₪» вписано текстом | `Banners.cshtml:65-68, 72` | §3 «До JS» | ролл. М4 |
| М5 | М | При ошибке количества площадь не «—» (видно «0.70 מ״ר · …») | `Banners.cshtml:304` | §3 | новое |
| М6 | М | Разметка ≠ макет: `<strong id="bn-sum-text">` вместо `data-summary` (жирный шрифт, he-сводка в 2 строки, панель +25 px), `data-area/data-unit` → `id`; лишняя `dir`, BOM | `Banners.cshtml:1, 10, 65-67` | CLAUDE §1.3 | ролл. М5 |

## 4. Подробно и код

### Б — блокеры

**Б1. Нижняя панель телефона → /stickers.** [проверено судьёй: live 390 he/ru, `j-he-390-error-bar.png`, `j-ru-390-error-bar.png`]
- Live: he «חשבו מחיר למדבקות» → `/stickers`, ru «Рассчитать цену наклеек» → `/ru/stickers`. Ввод 49 в ширину: «Заказать» неактивна, а панель та же и активна. `_Layout.cshtml:32` передаёт `ViewData["BottomBar"]`, партиал его не читает, страница его не задаёт; `BottomBarModel` в проекте нет (grep). В макете (`he/banners.html:160`): «סה״כ ‎165 ₪‎ | להזמנה ←», ссылка = ссылке заказа.
- Почему Б: главная кнопка телефона на странице заказа ведёт на другой продукт; §7 прямо проверяет «не на /stickers». A2, A3, A4 ставили Б, A1 — В. Четвёртый повтор подряд.
- Как исправить. Общая часть — **дословно код Б1 ревью 22.11** (`2026-11-22-rollup-review.md`, §4 Б1): `record BottomBarModel(string Label, string Arrow)` в `Utils/Helpers.cs`, ветка `@if (bar is not null)` в `_BottomBar.cshtml` с `data-bar-total` / `data-bar-ok`, ключ `total` в `_BottomBar.{he,ru}.resx`. Часть страницы:
```cshtml
@* Pages/Banners.cshtml, в блоке @{ } вверху *@
ViewData["BottomBar"] = new PrintABC.Utils.BottomBarModel(L["bar_order"].Value, isRtl ? "←" : "→");
```
`bar_order` в `Banners.{he,ru}.resx`: «להזמנה» / «Заказать». Итог и ссылку панели ведёт `setOrder()` / `barTotal` из скрипта В2.

### В — важно

**В1. Иврит: «₪ 165» вместо «165 ₪».** [проверено судьёй: коды `#bn-total` = `31 36 35 20 20aa`, без U+200E; по координатам глифов ₪ x=57, цифры x=106–154 — знак слева, `j-he-390-summary.png`; в resx he нет U+200E]
- Затронуты: `#bn-unit`/`#bn-total` (Razor `:67-68`, JS `:314-315`), строка «מחיר:» в WhatsApp (`wa_price_one/_many`, he.resx `:288, 291`), подзаголовок «החל מ-130 ₪» (`:129`) и `meta_description` (`:123`) — в §8 там LRM есть. A1, A2, A3 — В; судья **В**, как у ролл-апов.
- Как исправить: `Helpers.Money(int)` из В2 ревью 22.11 (Razor), в JS — `money()` (скрипт В2 ниже). В `Banners.he.resx` значения скопировать из §8 с LRM: `…החל מ-&#x200E;130 ₪&#x200E; · …` (в обоих ключах). На /ru LRM не ставится.

**В2. WhatsApp на ручных `%0a`.** [проверено судьёй: resx `whatsapp_template` he/ru `:273` = `…%0a\n…`; live `getAttribute('href')` — сырой текст с `%0a⏎`, кириллицей и пробелами; раскодировано: «…דרך ␠\n📎 ← "מסמך"…», ru «…через ␠\n📎 → «Документ»…»; `grep -c encodeURIComponent` = 0]
- Работает случайно: браузер выкидывает LF из URL и кодирует остальное сам. `&`, `#`, `%` в тексте сломают ссылку. Последняя строка §5.1 разорвана. `wa_more` (`:49`) и `wa_big` (`:261`) тоже без кодирования. Ключей `wa_hello/wa_mat/wa_size/wa_fin_eyelets/wa_fin_none/wa_qty/wa_price/wa_price_n/wa_file` (§5, §8) нет — вместо них один шаблон. A1, A2, A3 — В; судья **В**.
- Как исправить. В обоих resx удалить `whatsapp_template`, `wa_fin_e/_n`, `wa_price_one/_many` и добавить 9 ключей §8 дословно (в шаблонах цены знака ₪ нет — его ставит `money()`). В скрипте:
```js
const t = {
    hello: @Json.Serialize(L["wa_hello"].Value),  mat: @Json.Serialize(L["wa_mat"].Value),
    size:  @Json.Serialize(L["wa_size"].Value),   finE: @Json.Serialize(L["wa_fin_eyelets"].Value),
    finN:  @Json.Serialize(L["wa_fin_none"].Value), qty: @Json.Serialize(L["wa_qty"].Value),
    price: @Json.Serialize(L["wa_price"].Value),  priceN: @Json.Serialize(L["wa_price_n"].Value),
    file:  @Json.Serialize(L["wa_file"].Value),
};
const isRtl = document.documentElement.dir === "rtl";
const money = p => isRtl ? "‎" + p + " ₪‎" : p + " ₪";            // ТЗ §8
const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replaceAll("{" + k + "}", v), s);
const barTotal = document.querySelector("[data-bar-total]"), barOk = document.querySelector("[data-bar-ok]"); // Б1

function setOrder(href) {
    [whatsappButton, barOk].forEach(a => {
        if (!a) return;
        if (href) { a.href = href; a.removeAttribute("aria-disabled"); }
        else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); }
    });
}
function updateWhatsappLink(sel, unit, total) {
    if (unit === null) return setOrder(null);
    const v = { w: sel.w, h: sel.h, n: Number(sel.qty) };
    const msg = [t.hello, t.mat, fill(t.size, v), sel.finish === "e" ? t.finE : t.finN, fill(t.qty, v),
        v.n > 1 ? fill(t.priceN, { unit: money(unit), total: money(total) }) : fill(t.price, { price: money(total) }),
        t.file].join("\n");
    setOrder(whatsappUrl + encodeURIComponent(msg));
}
// updateBigLink:
bigLink.href = whatsappUrl + encodeURIComponent(fill(bigTemplate.value, { w: sel.w, h: sel.h }));
// updateDisplayPrice, ветка без ошибки:
unitPrice.textContent = money(unit); totalPrice.textContent = money(total);
// в конце updateDisplayPrice (обе ветки):
if (barTotal) barTotal.textContent = totalPrice.textContent;
```
```cshtml
@* Banners.cshtml:49 *@
<a class="calc__ask" id="bn-more" href="@(WHATSAPP_URL + Uri.EscapeDataString(L["wa_more"].Value))" target="_blank" rel="noopener noreferrer">@L["qty_more"]</a>
```
Проверка после правки: раскодированный `href` T01/T02/T11 = §5.1 построчно, 📎 в одной строке с текстом, he «מחיר: ‎165 ₪‎».

**В3. Выбор не переживает «Назад» и F5.** [проверено судьёй: 0 вхождений `sessionStorage`/`pageshow`; live he/ru: высота 200 (319 ₪) → F5 = 70 / 165 ₪; → главная → «Назад» = 70 / 165 ₪; `sessionStorage` пуст]
- §3 (ключ `printabc-banners`, `"w|h|e|q"`, только верный выбор, мусор → умолчания) и T18–T19 §7. T19 «проходит» только потому, что хранилище не читается. Для баннера потеря ввода больнее, чем у ролл-апов (сброс трёх полей). A2 — Б, A1 — В; судья **В**, как ролл. В4 и предыдущие.
- Как исправить:
```js
const KEY = "printabc-banners", DEF = ["100", "70", "1", "1"];          // ТЗ §3
function save(sel) {
    try { sessionStorage.setItem(KEY, [sel.w, sel.h, sel.finish === "e" ? "1" : "0", sel.qty].join("|")); } catch (e) { }
}
function restore() {
    let s = null;
    try { s = sessionStorage.getItem(KEY); } catch (e) { }
    let v = (s || "").split("|");
    if (v.length !== 4 || !/^[01]$/.test(v[2]) || validateSize(v[0], v[1]) || validateQty(v[3])) v = DEF;
    widthInput.value = v[0]; heightInput.value = v[1]; qtyInput.value = v[3];
    finishRadios.forEach(r => r.checked = (r.value === "e") === (v[2] === "1"));
    updateDisplayPrice(false, false);
}
window.addEventListener("pageshow", e => { if (e.persisted) restore(); });
restore();                          // вместо последней строки updateDisplayPrice(false, false)
// в updateDisplayPrice, после updateWhatsappLink(sel, unit, total): save(sel);
```

**В4. Нет пункта «Баннеры» в меню ☰.** [проверено судьёй: live 390 he/ru — `#mobile-menu` = stickers, business-cards, catalogs, #products, #how, #reviews, #contact]
- Тот же открытый пункт (ролл. В5, мер. В6, конв. В5): `_Header.cshtml:54-56` с 17.11 не менялся. В макете (`he/banners.html:44-52`) после «רול אפ» идёт «שמשונית» с `aria-current="page"`.
- Как исправить: код В5 ревью 22.11 (функция `Cur()` и 7 пунктов) плюс восьмая строка:
```cshtml
<a href="/banners" aria-current="@Cur("/banners")">@L["banners"]</a>
```
Ключ `banners` в `_Header.{he,ru}.resx`: «שמשונית» / «Баннеры».

**В5. Ссылка в футере мёртвая, he-подпись не та.** [проверено судьёй: live he/ru — `# באנרים`, `# Баннеры`]
- §3/§7: футер ведёт на `/banners`, подпись = `title` «שמשונית». Футер не входил в коммит, но это пункт приёмки §7, а одна строка `/rollup` в том же месте сделана. A1, A4 — В; судья **В**.
- Как исправить:
```cshtml
@* _Footer.cshtml:20 *@
<a href="/banners">@L["banners"]</a>
```
`_Footer.he.resx:127` `banners` = «שמשונית». Заодно открытый М3 ролл-апов: `rollup` = «רול אפ» в `_Footer.he.resx` и `_Breadcrumbs.he.resx:145` (сейчас «רול-אפים»).

### М — мелочи

- **М1.** `:73` «Вопрос?» → `https://wa.me/972508494172` (live he/ru). §3/§7/§9.4: `WHATSAPP_URL` без текста. Исправить: `href="@WHATSAPP_URL" target="_blank" rel="noopener noreferrer"`. A3 — М, A1/A2 — М.
- **М2.** `base.css:15` `scroll-padding-bottom: 16px` (live: computed `16px`), `--bar-h` 72 px. §3 требует `calc(var(--bar-h) + 16px)` на ≤767. A4 не отметил, потому что в макете тоже 16px (см. «Замечания к макету»). Исправить в общем файле: `@media (max-width: 767.98px) { html { scroll-padding-bottom: calc(var(--bar-h) + 16px); } }`.
- **М3.** Блок `bn-*` (и `ru-*` из a332f92) добавлен в конец `base.css`, а §9.6 и CLAUDE §1.4 — `pages.css`. Значения верные, вид не страдает. A1 — В, A4 — «допустимо»; судья **М**. Исправить: перенести `base.css:~190-266` (`ru-*` и `bn-*`) в конец `pages.css` без изменений.
- **М4.** До JS (`j-he-390-nojs-summary.png`, JS выключен): сводка и площадь пустые, «Заказать» `href="#"`, итог «165 ₪» вписан текстом без LRM. С JS всё работает, поэтому М (A2 — В). Исправить:
```cshtml
<p class="cat-summary" data-summary id="bn-sum-text">@L["summary_line"].Value.Replace("{w}", "100").Replace("{h}", "70").Replace("{finish}", L["sum_fin_e"].Value).Replace("{qty}", "1")</p>
<div class="price-box__row"><span>@L["area_label"]</span><span id="bn-area" data-area>@L["area_val"].Value.Replace("{a}", 0.70.ToString("0.00", CultureInfo.CurrentUICulture)) · @L["area_min"]</span></div>
<div class="price-box__row"><span>@L["unit_label"]</span><span id="bn-unit" data-unit>@Money(165)</span></div>
… <output class="price-box__total" id="bn-total" aria-live="polite">@Money(165)</output>
<a class="btn btn--whatsapp btn--lg" id="bn-next" href="@WHATSAPP_URL" …>
```
- **М5.** Кол-во 11 / 0 / пусто: площадь остаётся «0.70 מ״ר · מחושב כ-1 מ״ר» (live he/ru). §3 и `banners.js` макета: при любой ошибке площадь «—». Исправить `:304`: `areaText.textContent = "—";`.
- **М6.** `:65` `<p class="cat-summary"><strong id="bn-sum-text">` — в макете `<p class="cat-summary" data-summary>` без `<strong>`. Из-за жирного шрифта he-сводка на 390 переносится на 2 строки, панель 515 px против 490 в макете (A4-4, причину нашёл судья: в макете вес 400, высота 25 px). `data-area`/`data-unit` заменены на `id`. Лишняя `dir` (`:10`), BOM в `:1`. Исправить разметкой из М4 (там же `data-*` и без `<strong>`).

### Правки общих файлов — закрывают несколько страниц сразу

| Файл | Что | Закрывает |
|---|---|---|
| `Utils/Helpers.cs` + `_BottomBar.cshtml` + `_BottomBar.{he,ru}.resx` | `BottomBarModel`, панель с итогом, ключ `total` (код Б1 22.11) | Б1 здесь, Б1 ролл-апов, конвертов, мероприятий, Б5 бухкнижек |
| `Utils/Helpers.cs` | `Money(int)` с LRM | Razor-часть В1 здесь, В2 ролл-апов, конвертов, В3 мероприятий |
| `_Header.cshtml` + `_Header.{he,ru}.resx` | 5 пунктов меню (бухкн., конв., мер., ролл-апы, баннеры) + `aria-current` | В4 здесь, В5 ролл-апов, конвертов, В6 мероприятий |
| `_Footer.cshtml` + `_Footer.he.resx` | `/banners`, `/events`; he «שמשונית», «רול אפ» | В5 здесь, М3 ролл-апов, В6 мероприятий (футер) |
| `wwwroot/css/base.css` → `pages.css` | `scroll-padding-bottom` на ≤767; перенос `ru-*`/`bn-*` | М2, М3 здесь и у ролл-апов |

Порядок: Б1 (общая панель + строка в странице), затем скрипт В2+В3 (он же закрывает JS-часть В1 и подключает панель), resx В1/В2, общие В4–В5, затем М.

## 5. Сняты судьёй

- **Ключи resx не по именам §8** (A1-13, A3-5 — В) — не ошибка. CLAUDE §2.1: «ключи — как в design/strings / resx», то есть свои ключи resx допустимы; значения совпадают дословно; так же снято 17.11, 20.11, 22.11. Исключение — `wa_*`: их явно требует §5 («Шаблоны — в resx, ключи `wa_*`»), они вошли в В2. `{qty}` вместо `{n}` — внутреннее.
- **hreflang/canonical в `<head>`** (A3-6, В) — общий `_Layout`, не эта страница: на live 0 `link[rel=alternate]` на всех страницах. Открыт как В7 ревью бухкнижек 15.11, снимается так же, как 20.11 и 22.11.
- **Нет `role="alert"`/`aria-live` у текста ошибки** (A3-8, М) — в макете так же; ошибка связана через `aria-describedby` и `aria-invalid`, появляется по blur/change. ТЗ этого не требует.
- **Фото без WebP/`srcset`/`fetchpriority`** (A3-10, М) — в макете тот же `banners.jpg`, у `<img>` есть `width/height`; общий вопрос скорости для всех страниц, не этой задачи.
- **Контент на +8 px ниже макета** (A4-5, М) — общий: `_Layout.cshtml:28` выводит `_Breadcrumbs` вне `.page-head`; на `/rollup` то же смещение (h1 y=128 против 120 в макете). Вне диапазона.
- **`@page "/Banners"` с заглавной** (A1-12) — так же у Rollup/Envelopes, маршрут регистронезависимый, `/banners` отдаёт 200. Лишняя `dir` вошла в М6.
- **Тестов нет** (A1, п. 8 чек-листа) — §7 описывает ручные сценарии, тестового проекта в решении нет.
- **A1-11, A2-7, A3-9** — это не находки (хардкод `" · "`/`"—"` допустим, Intl-разделитель верный, `fieldset` у количества не нужен).
- **Уровни переоценены:** панель (A1-4, В) → Б1; `sessionStorage` (A2-1, Б) → В3; «До JS» (A2-8, В) → М4; стили в base.css (A1-8, В) → М3. Дубли объединены: панель — A1-4, A2-2, A3-1, A4-1 → Б1; LRM — A1-3, A2-4, A3-2 → В1; `%0a`/кодирование/📎 — A1-1, A1-2, A2-3, A3-3, A3-4 → В2; wa.me — A1-9, A2-5, A3-7 → М1; футер — A1-7, A4-3 → В5; меню — A1-6, A4-2 → В4; сводка +25 px — A4-4 → М6.

## 6. Замечания к макету (наша сторона, не разработчику)

- **Горизонтальная прокрутка шапки макета.** [проверено судьёй: макет из `origin/claude/project-thread-rrsoja`, и через `file://`, и через `http://` — значит, не артефакт file://] `scrollWidth` he 834 при 768 (+66 px), ru 1074 при 768 (+306 px) и при 1024 (+50 px). Причина — `.header-actions` (кнопка «Рассчитать», «Доступность», переключатель языка) не помещаются; так на всех страницах макета (banners, rollup, envelopes, index), то есть это общая шапка макета. На сайте шапка своя, прокрутки нет. Скриншоты `j-mock-he-768-http.png`, `j-mock-ru-768-http.png`. Исправить в `layout.css` макета (раньше прятать полную навигацию / `lang-full` на ≤1100 px для ru) — отдельной задачей дизайна.
- **`scroll-padding-bottom` в макете 16px**, а ТЗ §3 (и ролл-апы, и баннеры) требует `calc(var(--bar-h) + 16px)` на ≤767. Макет и ТЗ расходятся — поэтому разработчик и A4 считают 16px «как в макете». Поправить `base.css` макета, чтобы эталон совпадал с ТЗ.

## 7. Не проверяли

Экранный диктор, контраст, Lighthouse, тёмная тема и печать, реальную отправку в WhatsApp с телефона, bfcache в iOS Safari, Azure (там /banners ещё 404). Таблицу T01–T20 на 1024 проверял только A4 по вёрстке, цены — A2 на 390/1366.

Вопросов владельцу нет.
