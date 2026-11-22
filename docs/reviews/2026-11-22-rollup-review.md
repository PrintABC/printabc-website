# Ревью «Ролл-апы» (/rollup), 2026-11-22, первый проход

Продукт: сайт PrintABC, страница «Ролл-апы» / «רול אפ».
Диапазон: **83d11a4..f3c313f** (1 коммит: f3c313f «add rollup page support with full functionality», master2080, 22.11; 8 файлов, +655/−2).
**Следующее ревью от: f3c313f.**
Агенты: 4×Sonnet (git/сборка; цены и сценарии; WhatsApp/тексты/доступность; вид/телефон) + судья Opus.
Эталоны: ТЗ v1.0.1 (`docs/rollup/tz.md`, 21.11), макет PR #13 (ветка `claude/project-thread-gg12d9`, 8f0b7be: `design/mockup/{he,ru}/rollup.html`, `rollup.js`, стили `ru-*` в `pages.css:379-393`). Правила разработчика — `CLAUDE.md` репозитория дизайна (в ветке сайта `CLAUDE.md` нет, `/home/user/site/CLAUDE.md` не существует).
Где проверяли: Azure ещё без /rollup (404), поэтому всё проверено на локальном сайте `localhost:5080` = f3c313f. Судья пересобрал `--no-incremental` в отдельную папку: 0 предупреждений / 0 ошибок. Скриншоты: `2026-11-22-rollup-img/` (агенты `a2-…a4-…`, судья `j-…`).
Не ошибки (решения 15.11): цена в браузере из `data-price`, inline JS, пустой `RollupModel`, ссылка `api.whatsapp.com/send/?phone=972508494172&text=`, нет сервера/API, нет строки НДС, только самовывоз, оплаты на сайте нет.

**Открыто: Б — 1 (Б1), В — 5 (В1–В5), М — 5 (М1–М5).** Из них 9 — повторы ошибок «Конвертов» (17.11) и «Мероприятий» (20.11), см. колонку «Повтор».

## 1. Коротко

- Готовность примерно **65 %** [оценка]. Сборка без ошибок и предупреждений. Цены 280/540/750 и цена за шт. 280/270/250 совпадают с ТЗ §2. T01–T03 проходят на he и ru (390 и 1366), консоль чистая. Тексты §8 совпадают на обоих языках. Иврит «85×200» везде в изолятах, так что прошлый повтор «200×85» на этот раз **исправлен**.
- **Блокер Б1** (третий раз подряд): на телефоне нижняя панель зовёт «Рассчитать цену наклеек» и ведёт на /stickers, итога в ней нет. Общий `_BottomBar` после 17.11 и 20.11 не трогали.
- **В1:** стили `ru-*` не перенесены. Кнопки количества — плоские «таблетки» в одну строку, фото 268 px вместо 220. На телефоне «Ваш заказ» стоит после «Что входит», а не под количеством. Правка — 15 строк из макета (судья проверил её вставкой на live).
- Остальные повторы один в один: «₪ 280» без LRM (В2), WhatsApp на ручных `%0a` с разрывом перед 📎 (В3), нет sessionStorage, T04 и T07 падают (В4), нет пункта в меню ☰ (В5), «Вопрос?» ведёт на wa.me (М1), `scroll-padding-bottom` (М2).
- После ревью 20.11 разработчик сделал одну правку: 83d11a4 перенёс стили `ev-*` (закрыт В1 «Мероприятий»). Общие файлы (`_BottomBar`, `_Header`, `_Footer`, `base.css`) не меняли. Правки общих файлов из §4 закрывают одним разом Б1, меню, М1 и М2 на трёх-четырёх страницах (см. «Правки общих файлов»).

## 2. Что работает [проверено]

- Сборка: `dotnet build --no-incremental` — 0 Warning(s), 0 Error(s) (судья, отдельная папка вывода; агент 1 — так же).
- Цены: `data-price` = 280/540/750, на кнопках 280/270/250 «за шт.», по умолчанию 1 шт. (`checked`). JS своих цен не хранит, берёт `radio.dataset.price`, расчёта нет.
- T01–T03: итог в «Ваш заказ» = 280/540/750, и это же число стоит в тексте WhatsApp. Агент 2 проверил he/ru × 390/1366, судья — he/ru 390.
- Ссылка заказа — общая `WHATSAPP_URL` (`Utils/Helpers.cs:21`). Ссылка «больше 3» после раскодирования совпадает с §5.2, в ней нет цены и количества. Строки WhatsApp, кроме В2–В3, совпадают с §5.1.
- Иврит «85×200» в LRI/PDI во всех строках resx (meta_title, meta_description, подзаголовок, alt, incl_1, file_1–2, шаблон WhatsApp, wa_more, сводка). Повтора «200×85» нет.
- Тексты §8 на двух языках совпадают дословно (ключи свои, см. «Сняты»). В he и ru по 41 ключу, наборы совпадают, заглушек `[…]` нет. Есть `lang/dir`, свои `title` и `description`.
- Доступность: skip-link, `fieldset/legend` «Количество», настоящие radio, стрелки меняют выбор и итог, видимый фокус (`a3-*-focus-1366.png`), `<output aria-live="polite">`, иконки `aria-hidden`, у `<img>` есть `width/height`.
- Нет `style=""` и `console.*`, `data-price` в инвариантной культуре. Строки НДС нет.
- Плитка на главной и ссылка в футере ведут на `/rollup`, на /ru — на `/ru/rollup`. Крошки ru «Главная / Ролл-апы».
- Горизонтальной прокрутки нет на 390/768/1024/1366 (he и ru).

## 3. Находки

| ID | Ур. | Что | Где | ТЗ | Повтор |
|---|---|---|---|---|---|
| Б1 | Б | Нижняя панель телефона ведёт на /stickers, итога нет | `Shared/_BottomBar.cshtml:2`, `_Layout.cshtml:32`, `Rollup.cshtml:4-11` | §3, §7 | конв. Б1, мер. Б1 |
| В1 | В | Стили `ru-*` не перенесены: кнопки в строку, фото высокое, на телефоне «Ваш заказ» после «Что входит» | `wwwroot/css/pages.css` (нет блока) | §3, §9.6 | мер. В1 |
| В2 | В | Иврит: нет LRM у цены, видно «₪ 280» (итог, кнопки, WhatsApp, подзаголовок, meta) | `Rollup.cshtml:26,30,34,53,150`, `Rollup.he.resx:123,129,225` | §3, §5, §7, §8 | конв. В2, мер. В3 |
| В3 | В | WhatsApp: ручные `%0a`/`%2B`, нет `encodeURIComponent`, разрыв перед 📎 | `Rollup.{he,ru}.resx:225`, `Rollup.cshtml:98, 136-146` | §5, §8, §9.1 | конв. В3, мер. В4 |
| В4 | В | Нет sessionStorage: «Назад» и F5 сбрасывают на 1 шт. (T04, T07) | `Rollup.cshtml:96-156` | §3, §7 | конв. В4, мер. В5 |
| В5 | В | Нет пункта «Ролл-апы» в меню ☰ (и бухкнижек, конвертов, мероприятий) | `Shared/_Header.cshtml:53-61` | §3, §7, §11.12 | конв. В5, мер. В6 |
| М1 | М | «Вопрос?» ведёт на `wa.me`, а не на `WHATSAPP_URL` | `Rollup.cshtml:58` | §3, §7, §9.4 | конв. М5, мер. М1 |
| М2 | М | `scroll-padding-bottom: 16px` при панели 72 px | `wwwroot/css/base.css:15` | §3 | конв. М3, мер. М2 |
| М3 | М | Иврит: крошка и футер «רול-אפים», а в ТЗ и макете «רול אפ» | `_Breadcrumbs.he.resx:141`, `_Footer.he.resx:177` | §3, §8 `title` | новое |
| М4 | М | «Больше 3» без `encodeURIComponent`; у кнопки заказа `href="#"` до JS | `Rollup.cshtml:38, 57` | §5 | новое |
| М5 | М | Мусор: неиспользуемые `currentCulture/dir`, BOM; `data-summary` макета заменён на `id` | `Rollup.cshtml:1, 8-10, 52` | CLAUDE §1.3 | конв. М6, мер. М3–М4 |

## 4. Подробно и код

### Б — блокеры

**Б1. Нижняя панель телефона: «Рассчитать цену наклеек» → /stickers.** [проверено: код; live 390 he/ru, судья — Playwright]
- Что не так: `_BottomBar.cshtml:2` жёстко ставит `href="/stickers"` и `calculate_stickers`. `_Layout.cshtml:32` передаёт `ViewData["BottomBar"]`, но партиал его не читает, а Rollup его не задаёт. Live: he «חשבו מחיר למדבקות» → `/stickers`, ru «Рассчитать цену наклеек» → `/ru/stickers`. После выбора 3 шт. панель не меняется. Модели `BottomBarModel` в проекте нет (grep). В макете панель такая: «סה״כ ‎280 ₪‎ | להזמנה ←» / «Итого 280 ₪ | Заказать →», ссылка = ссылка заказа (`he/rollup.html:143`).
- Почему Б: на странице заказа главная кнопка телефона ведёт на другой продукт. Это видит каждый покупатель с телефона, и §7 прямо проверяет «не на /stickers». Агенты 2, 3 и 4 ставили Б, агент 1 — В. Третий повтор после Б1 17.11 и Б1 20.11.
- Как исправить. Общая часть — тот же код, что Б1 ревью 20.11, делается **один раз** для всех страниц:
```csharp
// Utils/Helpers.cs, внутри namespace PrintABC.Utils (рядом с классом Helpers)
public record BottomBarModel(string Label, string Arrow);
```
```cshtml
@* Pages/Shared/_BottomBar.cshtml — строку 2 заменить (строка 1, wa-float, остаётся): *@
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
Ключ `total` («סה״כ» / «Итого») добавить в `Resources/Pages/Shared/_BottomBar.{he,ru}.resx`. Стили `.bottom-bar__price/__label/__total` уже есть (`layout.css:103-105`).
Часть страницы:
```cshtml
@* Pages/Rollup.cshtml, в блоке @{ } вверху *@
ViewData["BottomBar"] = new BottomBarModel(L["bar_order"].Value, isRtl ? "←" : "→");
```
Ключ `bar_order` добавить в `Rollup.{he,ru}.resx`: «להזמנה» / «Заказать» (§8). Итог и ссылку панели обновляет общий скрипт из В3 (`barTotal`, `barOk`). Отступ снизу — М2.

### В — важно

**В1. Стили `ru-*` не перенесены в `wwwroot/css/pages.css`.** [проверено судьёй: grep `ru-` по `wwwroot/css/*.css` — 0; live 390/1024/1366; `j-he-390-qty.png`]
- В макете есть блок `/* ---- Roll-up stands ---- */` (`design/mockup/assets/css/pages.css:379-393`), а коммит CSS не трогает. Live: `.ru-qtys .opt-list` без grid, три кнопки по 44 px стоят столбиком, цена и «за шт.» в одной строке. Фото 268 px на 390 и 525 px на 1366 (в макете 220 и 380). На 390 «Что входит» y=844, «Ваш заказ» y=1101 (he) / 1154 (ru), то есть заказ стоит после «Что входит». ТЗ v1.0.1 и §3 требуют обратного: «блок заказа под кнопками количества».
- Уровень: агенты 1, 3 и 4 ставили Б. Судья ставит **В**, как В1 «Мероприятий»: цена, итог и ссылка верны, нарушены вёрстка макета и порядок на телефоне. Но это повтор после прямого замечания 20.11 (там правку сделали отдельным коммитом 83d11a4), и без него телефонная версия не готова: исправлять вместе с Б1.
- Как исправить (дословно из макета, в конец `wwwroot/css/pages.css`):
```css
/* ---- Roll-up stands ---- */
.ru-hero { width: 100%; height: clamp(220px, 28vw, 380px); object-fit: cover; border-radius: 14px; }
.ru-qtys .opt-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.ru-qty { flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; min-height: 96px; padding: 12px 14px; border-radius: var(--r-md); }
.pill.ru-qty:has(input:checked) { padding: 11px 13px; }
.ru-qty__name { font-weight: 700; }
.ru-qty__total { font-size: 1.25rem; font-weight: 800; }
.ru-qty__unit { font-size: 15px; color: var(--c-muted); font-weight: 400; }
/* phone: order panel right under the quantity choice, "What's included" after it (as in the design) */
@media (max-width: 767.98px) {
  #ru-calc .product-layout__main { display: contents; }
  #ru-calc .summary-panel { order: 1; flex-basis: 100%; }
  #ru-calc .ru-incl { order: 2; }
  #ru-calc .ru-hero, #ru-calc .ru-qtys, #ru-calc .ru-more { flex-basis: 100%; }
}
```
Проверено вставкой этого блока на live (`j-he-390-withcss.png`). На 390: 3 кнопки в ряд по 109–132 px, фото 220, «Ваш заказ» y=757 сразу под количеством, «Что входит» y=1202. На 1024 фото 287, на 1366 — 380. Прокрутки нет. Совпадает с замерами макета агента 4.

**В2. Иврит: цена без LRM, видно «₪ 280».** [проверено: в коде и в раскодированном WhatsApp нет U+200E; по координатам символов на live he знак ₪ стоит левее цифр (итог x=57 против 106), `j-he-390-summary.png`, `j-he-390-qty.png`]
- Затронуты: итог (`Rollup.cshtml:150`, начальное значение `:53`), кнопки количества (`:26, 30, 34` — итог и «за шт.»), строка «מחיר:» в WhatsApp (`he.resx:225`), подзаголовок «החל מ-250 ₪» (`he.resx:129`) и `meta_description` (`he.resx:123`). В §8 LRM в этих строках стоит, в макете `money()` = `t.lrm + n + ' ₪' + t.lrm` (`rollup.js:23`).
- Уровень: агент 3 ставил Б, агенты 1, 2 и 4 — В или М. Судья ставит **В**, как В2 «Конвертов» и В3 «Мероприятий»: число верное, неверен порядок знака, а §7 прямо проверяет «540 ₪, не ₪ 540».
- Как исправить. Razor — одна общая функция (её используют и конверты с мероприятиями, у них тот же открытый пункт):
```csharp
// Utils/Helpers.cs, в классе Helpers (using System.Globalization уже есть)
public static string Money(int p) =>
    CultureInfo.CurrentUICulture.TextInfo.IsRightToLeft ? $"‎{p} ₪‎" : $"{p} ₪";
```
```cshtml
@* Rollup.cshtml :26 (так же :30 с 540/270, :34 с 750/250) *@
<span class="ru-qty__name">1 @L["units"]</span><span class="ru-qty__total">@Money(280)</span><span class="ru-qty__unit">@Money(280) @L["qty_unit"]</span>
@* :53 *@
<output class="price-box__total" id="ru-total" aria-live="polite">@Money(280)</output>
```
В JS — `money()` из скрипта В3. В `Rollup.he.resx` скопировать строки §8 как есть (с LRM вокруг «250 ₪» в `rollup_description` и вокруг «280 ₪»/«250 ₪» в `meta_description`). В XML это `&#x200E;250 ₪&#x200E;`. Проверено вставкой: с LRM цифры встают левее ₪ (итог 57 против 148), как в макете (`j-he-390-fixed.png`). На /ru `Money` и `money` LRM не ставят.

**В3. Текст WhatsApp собран из ручных `%0a`.** [проверено: resx + код + раскодированный `href` на live he/ru, судья]
- `whatsapp_template` (he/ru `:225`) — одна строка, где части разделены `%0a` плюс настоящим переводом строки, а «+» записан как `%2B`. `updateWhatsappLink` склеивает `whatsappUrl + template` без `encodeURIComponent` (`Rollup.cshtml:145`). Сейчас это работает случайно: браузер выкидывает LF из URL и сам кодирует пробелы и иврит. Последняя строка разорвана, перед 📎 стоит лишний `%0a`. Что получает клиент:
```text
…מחיר: 750 ₪ כולל מע״מ
את קובץ ההדפסה אשלח מיד דרך ␠
📎 ← "מסמך" (לא "גלריה").
```
  На ru так же: «…через ␠\n📎 → «Документ»…». В §5.1 это одна строка. Ключей `wa_*` из §5/§8 нет.
- Уровень: агент 3 ставил Б, агенты 2 и 4 — В. Судья ставит **В**, как В3 «Конвертов» и В4 «Мероприятий»: текст читаемый, цена верная.
- Как исправить. В обоих resx удалить `whatsapp_template` и добавить 6 ключей §8 без `%0a`/`%2B` (`wa_hello, wa_size, wa_kit, wa_qty, wa_price, wa_file`, значения — дословно таблица §8, в he с LRI/PDI). В `summary_line` заменить `{qty}` на `{n}`. Весь скрипт страницы (закрывает сразу В2-JS, В3, В4 и часть Б1):
```cshtml
@section Scripts {
<script>
(() => {
    const t = {
        summary: @Json.Serialize(L["summary_line"].Value),
        hello: @Json.Serialize(L["wa_hello"].Value),
        size:  @Json.Serialize(L["wa_size"].Value),
        kit:   @Json.Serialize(L["wa_kit"].Value),
        qty:   @Json.Serialize(L["wa_qty"].Value),
        price: @Json.Serialize(L["wa_price"].Value),
        file:  @Json.Serialize(L["wa_file"].Value),
    };
    const whatsappUrl = @Json.Serialize(WHATSAPP_URL);
    const KEY = "printabc-rollup", DEF = "1";                       // ТЗ §3
    const isRtl = document.documentElement.dir === "rtl";
    const money = p => isRtl ? "‎" + p + " ₪‎" : p + " ₪";  // ТЗ §8
    const fill = (s, n, price) => s.replaceAll("{n}", n).replaceAll("{price}", price);

    const root = document.getElementById("ru-calc");
    const radios = root.querySelectorAll('input[name="qty"]');
    const sumText = document.getElementById("ru-sum-text");
    const total = document.getElementById("ru-total");
    const next = document.getElementById("ru-next");
    const barTotal = document.querySelector("[data-bar-total]");      // Б1
    const barOk = document.querySelector("[data-bar-ok]");

    function render(q) {
        const r = [...radios].find(x => x.value === q) || radios[0];
        r.checked = true;
        const n = r.value, price = money(Number(r.dataset.price));
        sumText.textContent = fill(t.summary, n, price);
        total.textContent = price;
        const msg = [t.hello, t.size, t.kit, fill(t.qty, n, price), fill(t.price, n, price), t.file].join("\n");
        next.href = whatsappUrl + encodeURIComponent(msg);
        if (barTotal) barTotal.textContent = price;
        if (barOk) barOk.href = next.href;
        try { sessionStorage.setItem(KEY, n); } catch (e) { }
    }
    function restore() {
        let s = null;
        try { s = sessionStorage.getItem(KEY); } catch (e) { }
        render(s === "1" || s === "2" || s === "3" ? s : DEF);       // иное → 1 шт. (ТЗ §4)
    }
    root.addEventListener("change", e => { if (e.target.name === "qty") render(e.target.value); });
    window.addEventListener("pageshow", e => { if (e.persisted) restore(); });
    restore();
})();
</script>
}
```
Проверено судьёй вставкой этого скрипта на live he 390. Раскодированный текст = §5.1 построчно, с «מחיר: ‎750 ₪‎», 📎 стоит в той же строке. T01 = 280, T03 = 750, T07 (3 → F5) = 750, T05 «7» и T06 «""» → 280.

**В4. Выбор не переживает «Назад» и перезагрузку (T04, T07).** [проверено: в коде 0 вхождений `sessionStorage`/`pageshow`; live he/ru: 3 шт. → F5 = 280 ₪, 2 шт. → главная → «Назад» = 280 ₪, `sessionStorage` = `{}`]
- ТЗ §3 (ключ `printabc-rollup`, значения "1"/"2"/"3", try/catch, загрузка + `pageshow`) и §7 T04–T07. T05/T06 сейчас проходят только потому, что значение вообще не читается.
- Уровень: агенты 2 и 3 ставили Б, агенты 1 и 4 — В. Судья ставит **В**, как В4 «Конвертов» и В5 «Мероприятий».
- Как исправить: `restore()` / `sessionStorage.setItem` / `pageshow` в скрипте В3 (выше). Отдельного кода не нужно.

**В5. Нет пункта «Ролл-апы» в меню ☰.** [проверено: код; live 390 — `#mobile-menu` = stickers, business-cards, catalogs, #products, #how, #reviews, #contact]
- Меню (`_Header.cshtml:54-56`) с 17.11 не менялось. В макете (`he/rollup.html:45-51`) после каталогов идут бухкнижки, конверты, мероприятия и ролл-апы (`aria-current="page"`). ТЗ §3 сам предупреждает: «если пунктов бухкнижек, конвертов и событий ещё нет — сначала закрыть В6 ревью 20.11». Это тот же открытый пункт (конв. В5, мер. В6, бухкн. В4), а не новая ошибка страницы. Отдельно не считается, но и не снимается: приёмка §7 его требует.
- Как исправить (одна правка на четыре страницы):
```cshtml
@* _Header.cshtml, в блоке @{ } вверху *@
var page = (Context.Request.Path.Value ?? "/").ToLowerInvariant();
if (page == "/ru" || page.StartsWith("/ru/")) page = page.Substring(3);
string? Cur(string href) => page == href ? "page" : null;

@* _Header.cshtml:54-56 — заменить три строки: *@
<a href="/stickers" aria-current="@Cur("/stickers")">@L["stickers"]</a>
<a href="/business-cards" aria-current="@Cur("/business-cards")">@L["business_cards"]</a>
<a href="/catalogs" aria-current="@Cur("/catalogs")">@L["catalogs"]</a>
<a href="/pinkasim" aria-current="@Cur("/pinkasim")">@L["pinkasim"]</a>
<a href="/envelopes" aria-current="@Cur("/envelopes")">@L["envelopes"]</a>
<a href="/events" aria-current="@Cur("/events")">@L["events"]</a>
<a href="/rollup" aria-current="@Cur("/rollup")">@L["rollups"]</a>
```
Если `aria-current` равен `null`, Razor атрибут не выводит. Префикс /ru подставит `LocalizedAnchorTagHelper`. Ключи в `_Header.{he,ru}.resx`: `pinkasim` «פנקסים» / «Бухгалтерские книжки», `envelopes` «מעטפות» / «Конверты», `events` «הדפסה לאירועים» / «Печать для мероприятий», `rollups` «רול אפ» / «Ролл-апы». В футере заодно закрыть вторую половину В6 «Мероприятий»: `_Footer.cshtml:15` `<a href="#">@L["branding"]</a>` → `<a href="/events">@L["events"]</a>`.

### М — мелочи

- **М1.** `Rollup.cshtml:58` — «Вопрос?» ведёт на `https://wa.me/972508494172` (live he/ru). §3 и §7: «`WHATSAPP_URL` без текста, не wa.me». Исправить: `href="@WHATSAPP_URL" target="_blank" rel="noopener noreferrer"`. Агенты 2 и 3 ставили В/Б, судья ставит М, как у «Конвертов» и «Мероприятий»: ссылка открывает тот же чат. Иконки `wa.me` в `_BottomBar:1-2` и `_Header:64` — старый общий код вне диапазона, их менять в той же общей правке.
- **М2.** `base.css:15` задаёт `scroll-padding-bottom: 16px`, а `--bar-h` = 72 px, поэтому фокус может уйти под панель. §3 требует `calc(var(--bar-h) + 16px)` на ≤767. Исправить (общий файл, закрывает и конверты с мероприятиями): `@media (max-width: 767px) { html { scroll-padding-bottom: calc(var(--bar-h) + 16px); } }`.
- **М3.** Иврит: крошка «רול-אפים» (`_Breadcrumbs.he.resx:141`, ключ добавлен в этом коммите) и подпись в футере «רול-אפים» (`_Footer.he.resx:177`, ссылка включена в этом коммите). По §3 крошка = `title` «רול אפ», в макете и крошка, и футер «רול אפ» (`he/rollup.html:82, 128`), h1 тоже «רול אפ». Исправить оба значения на `רול אפ`. ru «Ролл-апы» верно.
- **М4.** `Rollup.cshtml:38` — `href="@(WHATSAPP_URL + L["wa_more"].Value)"` без кодирования. Сейчас работает (в тексте нет `&`, `#`, `+`), но §5 требует `encodeURIComponent`. Исправить: `href="@(WHATSAPP_URL + Uri.EscapeDataString(L["wa_more"].Value))"`. `:57` — у кнопки заказа `href="#"` до выполнения JS, в макете стоит адрес WhatsApp: `href="@WHATSAPP_URL"`.
- **М5.** Удалить неиспользуемые `currentCulture` и `dir` (`:8`, `:10`), `isRtl` нужен для Б1. Убрать BOM в начале `Rollup.cshtml`. Сводка: в макете `<p class="cat-summary" data-summary>`, на сайте `<strong id="ru-sum-text">` (`:52`). CSS на это не завязан, но CLAUDE §1.3 просит не переименовывать — при правке можно добавить `data-summary` к тому же элементу.

### Правки общих файлов — закрывают несколько страниц сразу

| Файл | Что | Закрывает |
|---|---|---|
| `Utils/Helpers.cs` + `_BottomBar.cshtml` + `_BottomBar.{he,ru}.resx` | `BottomBarModel`, панель с итогом, ключ `total` | Б1 здесь, Б1 конвертов, Б1 мероприятий, Б5 бухкнижек (на каждой странице ещё одна строка `ViewData` и 2 строки JS) |
| `Utils/Helpers.cs` | `Money(int)` с LRM | Razor-часть В2 здесь, В2 конвертов, В3 мероприятий |
| `_Header.cshtml` + `_Header.{he,ru}.resx` | 4 пункта меню + `aria-current` | В5 здесь, В5 конвертов, В6 мероприятий (меню), В4 бухкнижек |
| `_Footer.cshtml` + `_Footer.he.resx` | events вместо заглушки `branding`; «רול אפ» | В6 мероприятий (футер), М3 здесь |
| `wwwroot/css/base.css` | `scroll-padding-bottom` на ≤767 | М2 здесь, М3 конвертов, М2 мероприятий |
| `_Breadcrumbs.he.resx` | `rollup` = «רול אפ» | М3 здесь |

Порядок: Б1 + В1 (телефон), затем В3 (новый скрипт, он же закрывает В2-JS и В4), В2 в разметке и resx, В5, затем М.

## 5. Сняты судьёй

- **«Name1 / Color1 / Bitmap1 / Icon1 — заглушки в resx»** (агент 3, М2) — ложная. Это пример из стандартного XML-комментария шаблона resx: `<!-- … -->`, строки 3–61 `Rollup.he.resx`, внутри комментария. Такой же блок есть во всех 26 resx проекта. Ключами он не является и в `L[…]` не попадает. Агент 1 оценил верно.
- **hreflang/canonical в `<head>`** (агент 3, В2) — общий недочёт `_Layout.cshtml`, а не этой страницы. На live `link[rel=alternate]` = 0 на `/`, `/stickers`, `/envelopes`, `/events` и `/rollup`, `_Layout` с f3c313f не менялся. Пункт уже открыт как В7 ревью бухкнижек 15.11 (снят так же 20.11).
- **Ключи resx не как в §8 и без префикса `rl_*`** (агент 1, М2; агент 3, М2) — ключи внутренние, значения совпадают дословно, так же снято 17.11 и 20.11. `rl_*` — имена строк макета (`strings_he_ru.json`), не требование к resx. Исключение — `wa_*`: их требует §5, и они вошли в В3.
- **`file_4`/`file_5` переставлены** (агент 3, В1) — на экране порядок тот же, что в таблице §8 (там `file_5` стоит перед `file_4`).
- **«250 ₪» жёстко в подзаголовке** (агент 2, М2) — это дословный текст §8 `subtitle`, а не второй источник цены. Отсутствие LRM в нём учтено в В2.
- **Цены «280 ₪» на кнопках вписаны в разметку** (агент 2, М1) — по решению 15.11 и §2 (цена за шт. — текст кнопки).
- **Тестов нет** (агент 1, п. 8 чек-листа) — §7 описывает ручные сценарии, тестового проекта в решении нет и он не требуется.
- **`CLAUDE.md` нет в ветке сайта** (агент 1) — это не ошибка кода. Правила лежат в репозитории дизайна (`CLAUDE.md:56-57` описывает /rollup), путь в задании ревью неверный.
- **Нет `aria-atomic`, `target` у «Вопрос?», стрелки в RTL идут «назад»** (агенты 2, 3) — `<output>` уже живой регион; поведение стрелок стандартное. `target` вошёл в М1.
- **Блоки «В3–В5» агента 3** (fieldset, aria-live, skip-link) — это не находки, а работающее, перенесено в §2.
- **Плитка и ссылка в футере** (агент 3, Б7, вторая половина) — работают на he и ru (live), сняты. Заглушка events в футере — часть В6 «Мероприятий», учтена в В5.
- **Высота «Ваш заказ» на 768/1024 ниже «Что входит»** (агент 4) — так и в макете. Ошибкой это становится только на ≤767, и это учтено в В1.

Вопросов владельцу нет.
