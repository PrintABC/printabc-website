# Как исправить находки ревью каталогов (до 7befbea)

Патчи: `2026-11-09b-catalogs-patches/` (all.diff = 1–5 вместе, применяется к 7befbea).

# Советчик по исправлениям (агент 7): «Каталоги и журналы», HEAD 7befbea

Вход: /tmp/claude-0/review2/agent6-verify.txt (открытые находки), ТЗ docs/catalogs/tz.md.
Репозиторий /tmp/claude-0/site НЕ менялся (git status пуст). Все исправления опробованы на копии /tmp/claude-0/fixtry:
- `dotnet build -c Release` → 0 ошибок, 0 предупреждений (CS8602 тоже ушло);
- юнит-тесты: 39 из 39 зелёные (T01–T13, V01–V16, см. исправление 5);
- POST-матрица T/V через curl на he и ru — все коды и цены как в ТЗ §10;
- Playwright (he и ru, 1366): manual_quote, ошибки, HTTP 500/400, обрыв сети, пределы страниц — см. «Как проверить» в каждом пункте.

Готовые патчи (каждый отдельно и все вместе; `git apply --check all.diff` на 7befbea проходит чисто):
  docs/catalogs/dev/2026-11-09-fixes/patches/1-validation.diff      исправление 1
  docs/catalogs/dev/2026-11-09-fixes/patches/2-front-msg.diff       исправления 2, 6, 7, 8 (страница, JS, resx, сообщение)
  docs/catalogs/dev/2026-11-09-fixes/patches/3-settings.diff        исправление 3
  docs/catalogs/dev/2026-11-09-fixes/patches/4-rounding-fields.diff исправление 4
  docs/catalogs/dev/2026-11-09-fixes/patches/5-tests.diff           исправление 5
  docs/catalogs/dev/2026-11-09-fixes/patches/all.diff               всё сразу
Ниже приведены ключевые куски этих патчей, полный текст смотрите в .diff.

ВАЖНО для локальной проверки: если запускать сайт командой `dotnet bin/Release/net10.0/PrintABC.dll` из папки проекта,
браузер получает ПУСТЫЕ .js/.css (сжатые статические файлы отдаются с Content-Length: 0), и кажется, что JS «не работает».
Запускайте `dotnet run -c Release` или `dotnet publish -c Release -o out` и затем `cd out && dotnet PrintABC.dll`.

## Порядок работ и оценка времени (для начинающего)

| # | Исправление | Закрывает | Приоритет | Время |
|---|---|---|---|---|
| 1 | Проверка ввода на сервере: метод ValidateInput в сервисе, порядок кодов как в §5 | Н2 (блокер), Б3, Б4 (сервер), Н5, Н6, Н7, Н8, М10 | Б | 3–4 ч |
| 2 | JS: manual_quote, ошибки, ответы не 200; новые блоки ошибок и ключи resx | Н1 (блокер), Н3, Н4, Б4 (JS), В4, М4, М5, М7 | Б | 3 ч |
| 3 | Числа формулы в appsettings.json, секция Catalogs, через IOptions | В1 (и делает возможными T12, T13) | В | 2–3 ч |
| 4 | Округление AwayFromZero; поля minApplied и spiralMm в ответе | В2, часть В9 | В | 0,5 ч |
| 5 | Проект юнит-тестов T01–T13, V01–V16 | В10 | В | 2 ч |
| 6 | Пределы, шаг и подсказка поля страниц на странице | В3 | В | 2 ч (входит в JS из п. 2) |
| 7 | Вынести скрипт в wwwroot/js/catalogs.js | В11 | В | 0,5 ч (если делать вместе с п. 2) |
| 8 | Формат цены на странице и в сообщении, кодирование ссылки WhatsApp | В7, М1 (частично), М2 | В | 1 ч |
| 9 | HTTP 400 и формат ответа | В9 (остаток) | В, вопрос владельцу | 0,5 ч (вариант А) |
| 10 | Нижняя панель на телефоне | В6, М6 | В | 2 ч |
| 11 | Превью брошюры | В8 | В | 4–6 ч (вёрстка по макету) |
| 12 | Мелочи | М3, М8, М11–М15 | М | 1–2 ч всего |

Зависимости: 1 → 3 → 5 (тестам T12/T13 нужен конфиг). 2 можно делать параллельно с 1; 6 и 7 удобнее делать вместе с 2.
Блокеры (1 и 2) вместе примерно 6–7 часов. Без исправления 1 не проходят T03 и T07, без 2 магазин получает заказы с чужой ценой.

----------------------------------------------------------------------------------------------------

## Исправление 1 (Б). Вся проверка §5 на сервере, в одном методе и в нужном порядке

Закрывает: Н2 (Range 4–36 режет спираль: T03, T07), Б3 (не проверяются формат, бумага, обложка, пределы §2, минимум без обложки,
шаг спирали, qty_max, коды bad_*), Б4 серверная часть (HTTP 500 на бумаге 150/999), Н5 (код ошибки зависит от культуры he/ru
и от значения по умолчанию), Н6 (MAX_QUANTITY = 1 000 000 вместо 100 000), Н7 (пропавшие поля молча становятся 100 шт. / 12 стр.),
Н8 (wpmessage с пустой ценой в ответе с ошибкой), М10 (CS8602).

Где:
- Pages/Catalogs.cshtml.cs:27 (константы), :29–37 ([BindProperty] и два [Range]), :43–66 (OnPostCalculate), :69–81 (BuildQuoteRequest), :110 (строка цены).
- Services/CatalogCalculatorService.cs:51–52 (шаг 4 для всех переплётов), :55–56 (GetPaperInfo для обложки вызывается всегда → исключение → HTTP 500), :26 (throw).

Почему так: сейчас форма привязывается сразу к int/enum/bool. Если привязка не удалась (пусто, «abc», «12.5», «-1» на иврите),
в свойстве остаётся значение по умолчанию, и по нему выбирается неверный код (Н5). Enum принимает «1» как A5 (Format=1 → цена).
Поэтому принимаем форму СТРОКАМИ и разбираем сами, инвариантной культурой, в порядке §5. У наклеек сделано через ModelState и Range,
но там нет такого списка кодов и порядка; для каталогов §5 требует именно порядок, поэтому отдельный метод.

Что сделать:
1. В Services/CatalogCalculatorService.cs добавить класс CatalogFormInput (все поля string?) и метод ValidateInput.
2. Удалить проверку `Pages % 4` из Calculate (теперь она в ValidateInput) и брать бумагу обложки только при HasCover.
3. В Pages/Catalogs.cshtml.cs убрать [BindProperty] и оба [Range] (свойства оставить: из них страница берёт значения по умолчанию,
   а CreateMessage строит текст), удалить константы MIN_/MAX_, переписать OnPostCalculate.
4. CreateMessage вызывать только для ready и manual_quote; при manual_quote вместо строки цены ключ msg_ask (§6).

Код (Services/CatalogCalculatorService.cs, добавить перед `public record CatalogQuoteRequest`):

```csharp
// Сырые значения формы: всё строки, чтобы самим решать, какая ошибка (bad_request, bad_format, ...)
public class CatalogFormInput
{
    public string? Format { get; set; }
    public string? Binding { get; set; }
    public string? InnerPageCount { get; set; }
    public string? InnerPaper { get; set; }
    public string? HasCover { get; set; }
    public string? CoverPaper { get; set; }
    public string? CoverPrint { get; set; }
    public string? Lamination { get; set; }
    public string? Quantity { get; set; }
}
```

Внутри класса сервиса, после GetInnerPaperSizes (и `using System.Globalization;` в начале файла):

```csharp
public static int[] GetCoverPaperSizes() => [250, 300];
public static string[] GetCoverPrints() => ["40", "44"];          // так их шлёт форма (cshtml:150, 154)
public const int MinQuantity = 6, MaxQuantity = 100_000;           // ТЗ §1; в исправлении 3 MaxQuantity уйдёт в конфиг

// ТЗ §2: шаг и минимум страниц блока
public static int GetPagesStep(CatalogBinding binding) => binding == CatalogBinding.Staple ? 4 : 2;
public static int GetPagesMin(CatalogBinding binding, bool hasCover) =>
    binding == CatalogBinding.Spiral ? 20 : (hasCover ? 4 : 8);
public static int GetPagesMax(CatalogBinding binding, int innerPaper) =>
    binding == CatalogBinding.Staple ? GetPaperInfo(innerPaper).StapleMaxPages : GetPaperInfo(innerPaper).SpiralMaxPages;

private static bool TryParseInt(string? s, out int value) =>
    int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out value);

// принимает только имя из enum (без учёта регистра); "1" или "A3" -> false
private static bool TryParseName<T>(string? s, out T value) where T : struct, Enum
{
    value = default;
    string? name = Enum.GetNames<T>().FirstOrDefault(n => string.Equals(n, s?.Trim(), StringComparison.OrdinalIgnoreCase));
    return name != null && Enum.TryParse(name, out value);
}

/// Проверки ТЗ §5 строго в этом порядке. Возвращает код первой ошибки или null.
/// too_thick остаётся в Calculate (нужна толщина).
public string? ValidateInput(CatalogFormInput f, out CatalogQuoteRequest? request)
{
    request = null;

    // 1. bad_request: поле отсутствует, не число, дробное
    if (string.IsNullOrWhiteSpace(f.Format) || string.IsNullOrWhiteSpace(f.Binding)
        || !TryParseInt(f.InnerPageCount, out int pages)
        || !TryParseInt(f.InnerPaper, out int innerPaper)
        || !bool.TryParse(f.HasCover, out bool hasCover)
        || !TryParseInt(f.Quantity, out int quantity))
        return "bad_request";
    int coverPaper = 0;
    if (hasCover && (!TryParseInt(f.CoverPaper, out coverPaper)
                     || string.IsNullOrWhiteSpace(f.CoverPrint)
                     || string.IsNullOrWhiteSpace(f.Lamination)))
        return "bad_request";

    // 2. bad_format, 3. bad_binding
    if (!TryParseName(f.Format, out CatalogSize format)) return "bad_format";
    if (!TryParseName(f.Binding, out CatalogBinding binding)) return "bad_binding";

    // 4. bad_paper: не из списка или запрещена для переплёта (300 г при скобе)
    if (!GetInnerPaperSizes().Contains(innerPaper) || GetPagesMax(binding, innerPaper) == 0)
        return "bad_paper";

    // 5. bad_cover, 6. bad_lamination — только при обложке
    string coverPrint = "";
    LaminationType lamination = LaminationType.None;
    if (hasCover)
    {
        coverPrint = f.CoverPrint!.Trim();
        if (!GetCoverPaperSizes().Contains(coverPaper) || !GetCoverPrints().Contains(coverPrint))
            return "bad_cover";
        if (!TryParseName(f.Lamination, out lamination))
            return "bad_lamination";
    }

    // 7–9. страницы
    if (pages % GetPagesStep(binding) != 0) return "pages_step";
    if (pages < GetPagesMin(binding, hasCover)) return "pages_min";
    if (pages > GetPagesMax(binding, innerPaper)) return "pages_max";

    // 10–11. тираж
    if (quantity < MinQuantity) return "qty_min";
    if (quantity > MaxQuantity) return "qty_max";

    request = new CatalogQuoteRequest(format, binding, pages, innerPaper, hasCover, coverPaper, coverPrint, lamination, quantity);
    return null;
}
```

В Calculate:

```diff
-            if (req.Pages % 4 != 0)
-                return CatalogQuoteResponse.Error("pages_step");
-
+            // вход уже проверен в ValidateInput
             int sheetsPerCopy = req.Pages / 2;
             PaperInfo innerPaper = GetPaperInfo(req.InnerPaper);
-            PaperInfo coverPaper = GetPaperInfo(req.CoverPaper);
+            PaperInfo? coverPaper = req.HasCover ? GetPaperInfo(req.CoverPaper) : null; // без обложки бумагу обложки не трогаем
 ...
-                coverCost = coverSheetsTotal * (coverPaper.SheetPriceIls + ...
+                coverCost = coverSheetsTotal * (coverPaper!.SheetPriceIls + ...
-            ... (req.HasCover ? 2 * coverPaper.ThicknessMm : 0);
+            ... (req.HasCover ? 2 * coverPaper!.ThicknessMm : 0);
```

Pages/Catalogs.cshtml.cs:

```diff
-        const int MIN_INNER_PAGE_COUNT = 4, MAX_INNER_PAGE_COUNT = 36, MIN_QUANTITY = 6, MAX_QUANTITY = 1_000_000;
-        [BindProperty] public CatalogSize Format { get; set; } = CatalogSize.A4;
-        ... [BindProperty, Range(MIN_INNER_PAGE_COUNT, MAX_INNER_PAGE_COUNT, ...)] public int InnerPageCount ...
-        ... [BindProperty, Range(MIN_QUANTITY, MAX_QUANTITY, ...)] public int Quantity ...
+        // Значения по умолчанию для страницы и данные для сообщения. Из формы НЕ привязываются:
+        // форма приходит строками в CatalogFormInput и проверяется в сервисе (ТЗ §5).
+        public CatalogSize Format { get; set; } = CatalogSize.A4;
+        ... (те же свойства, без [BindProperty] и без Range)
+        public int Quantity { get; set; } = 100;
```

```csharp
public IActionResult OnPostCalculate(CatalogFormInput input)
{
    string? errorCode = catalogCalculatorService.ValidateInput(input, out CatalogQuoteRequest? quoteRequest);
    if (errorCode != null)
        return new JsonResult(new { success = false, data = CatalogQuoteResponse.Error(errorCode) });

    CopyFromRequest(quoteRequest!);
    response = catalogCalculatorService.Calculate(quoteRequest!);
    if (response.Status == ValidationStatus.ValidationError) // too_thick: без сообщения WhatsApp (Н8)
        return new JsonResult(new { success = false, data = response });

    CreateMessage();
    return new JsonResult(new { success = true, data = response, wpmessage = WHATSAPP_URL + WhatsappMessage });
}

// проверенные значения -> свойства, из которых CreateMessage собирает текст
private void CopyFromRequest(CatalogQuoteRequest r)
{
    Format = r.Format; Binding = r.Binding; InnerPageCount = r.Pages; InnerPaper = r.InnerPaper;
    HasCover = r.HasCover; CoverPaper = r.CoverPaper; CoverPrint = r.CoverPrint;
    Lamination = r.Lamination; Quantity = r.Quantity;
}
```
(BuildQuoteRequest и `using System.ComponentModel.DataAnnotations;` удалить.) Параметр `CatalogFormInput input` ASP.NET заполняет
из полей формы с теми же именами (Format, InnerPageCount, ...), имена в cshtml менять не нужно.

В CreateMessage (было cs:110):
```diff
-            sb.Append($"{L["msg_price"]}: {response.PriceIncVatIls}₪ {L["msg_with_vat"]}");
+            if (response!.Status == ValidationStatus.ManualQuote)
+                sb.Append(L["msg_ask"]);                     // «Прошу рассчитать цену» / «אבקש הצעת מחיר» (ТЗ §6)
+            else
+                sb.Append($"{L["msg_price"]}: {response.PriceIncVatIls}₪ {L["msg_with_vat"]}");
```
(формат цены в сообщении меняется ещё раз в исправлении 8; ключ msg_ask добавляется в resx в исправлении 2).

Как проверить: V01–V16 и T01–T11 (ТЗ §10), на /catalogs и /ru/catalogs. Проверено на копии:
T03 → 1423,00 / 1679,14; T07 → 1550,52 / 1829,61 (регресс Н2 ушёл); V02, V06 → pages_min; V04, V15 → pages_max; V05, V11 (150 и 300 на скобе)
→ bad_paper, HTTP 200 вместо 500; V09 (A3 и «1») → bad_format; V10 → bad_binding; V12 → bad_cover; V13 → bad_lamination,
а «silk» без обложки → цена; V14: 0 и −1 → qty_min на обоих языках (Н5), 6.5 / abc / пусто / нет поля / 12.5 → bad_request;
V15 100 001 → qty_max; V16 лишние поля → 1346,19. Удобнее всего через юнит-тесты из исправления 5.

Открытые вопросы (не выдумываю за ТЗ):
- Шаг страниц спирали: ТЗ §2 и §11 п.6 по умолчанию 2, в коде было 4 (вопрос 9 агента 6). Патч следует ТЗ (2). Если Andriy утвердит 4,
  поменять одну цифру в GetPagesStep; тогда V06 (18 стр.) даст pages_step, а не pages_min, — тест V06 тоже придётся поправить.
- Значения coverPrint: ТЗ §5 пишет «4+0|4+4», форма шлёт «40»/«44». Патч принимает то, что шлёт форма. Если API должно принимать
  именно «4+0/4+4», поменять value у радиокнопок (cshtml:150, 154) и GetCoverPrints, плюс сравнение `== "44"` в Calculate.
- Регистр значений: binding/lamination принимаются без учёта регистра (форма шлёт «Staple», ТЗ пишет «staple»), так проходят оба.

----------------------------------------------------------------------------------------------------

## Исправление 2 (Б). JS: manual_quote, ошибки и ответы не 200; тексты в resx

Закрывает: Н1 (блокер: при manual_quote остаётся активной «Заказать» со ссылкой от прошлой цены), Н3 (при ошибке виден блок
«נחשב לכם אישית», на /ru — на иврите), Н4 (generic без текста), Б4 JS-часть (после HTTP 500 остаются старая цена и активная кнопка),
В4 (ключи order_minimum_hint, текст generic, msg_ask, текст кнопки manual_quote, тексты #invalid_prices), М4 (приглушение при запросе),
М5 (pageshow без persisted), М7 («יח׳» в сводке).

Где: Pages/Catalogs.cshtml:432 (только `if (response.ok)`, нет else), :436–437 (ветка manual_quote не трогает href и кнопку),
:440–449 (ошибка показывает блок manual), :262–263 (тексты на иврите прямо в cshtml), :244 («יח׳»), :259 (ключ order_minimum_hint
отсутствует в resx), :178–239 (нет блоков для generic и qty_max), :505–509 (pageshow с persisted).

Что сделать:
1. В resx (оба языка) добавить ключи (тексты ниже; he — черновик, отдать на вычитку носителю, кроме взятых из ТЗ/старого cshtml).
2. В cshtml: тексты manual-блока из resx; два новых блока ошибок (qty_max и generic); «יח׳» → @L["unit"]; тексты кнопок в data-*.
3. JS: один метод render(result) с тремя ветками — ready / manual_quote / всё остальное (любая ошибка, 500, не-JSON, обрыв сети).

resx (Resources/Pages/Catalogs.ru.resx и .he.resx, перед </root>):

| ключ | ru | he |
|---|---|---|
| cta_ask | Запросить расчёт в WhatsApp (ТЗ §4) | לבקשת הצעת מחיר ב-WhatsApp (ТЗ §4) |
| msg_ask | Прошу рассчитать цену (ТЗ §6) | אבקש הצעת מחיר (ТЗ §6) |
| manual_title | Рассчитаем индивидуально (ТЗ §3.2 п.13) | נחשב לכם אישית (было в cshtml:262) |
| manual_text | Отправьте параметры в WhatsApp — вернёмся с ценой. | שלחו לנו את הפרמטרים ב-WhatsApp — נחזור עם מחיר. (cshtml:263) |
| order_minimum_hint | Минимальный заказ 118 ₪ с НДС (ТЗ §4) | הזמנת מינימום 118 ₪ כולל מע״מ (черновик) |
| error_qty_max | Тираж больше 100 000 шт. Напишите нам — рассчитаем индивидуально. | הכמות גדולה מ-100,000 יח׳. כתבו לנו — נחשב לכם אישית. (черновик) |
| error_generic | Не удалось посчитать цену. Проверьте параметры или напишите нам. | לא הצלחנו לחשב מחיר. בדקו את הפרמטרים או כתבו לנו. (черновик) |
| pages_hint | {0}, {1} г: от {2} до {3} стр., кратно {4} (для исправления 6) | {0}, {1} גרם: {2}–{3} עמ׳, בכפולות של {4} (черновик) |

ТЗ не даёт текстов для qty_max, generic и bad_* — тексты выше мои, нужен ответ владельца. Коды bad_request и bad_* из обычного
интерфейса почти недостижимы (только пустое поле), поэтому показываем для них общий текст generic; если владелец захочет
отдельный текст на каждый bad_*, достаточно добавить блок `data-error="bad_paper"` и т. п. — JS найдёт его сам.

Внимание: ключ pages_hint содержит {0}…{4}. Через `@L["pages_hint"]` (IViewLocalizer) страница падает с FormatException (проверено),
поэтому в cshtml его выводить так: `@L.GetString("pages_hint")`.

Pages/Catalogs.cshtml:
```diff
-    <form ... id="calc-form" aria-labelledby="calc-title" autocomplete="off" novalidate="">
+    <form ... id="calc-form" aria-labelledby="calc-title" autocomplete="off" novalidate=""
+          data-limits="@Model.PageLimitsJson"
+          data-hint="@L.GetString("pages_hint")" data-bind-staple="@L["binding_staple"]" data-bind-spiral="@L["binding_spiral"]"
+          data-cta-order="@L["next_load_file"]" data-cta-ask="@L["cta_ask"]">
...
-                <p class="price-box__total">נחשב לכם אישית</p>
-                <p class="field__hint">שלחו לנו את הפרמטרים ב-WhatsApp — נחזור עם מחיר.</p>
+                <p class="price-box__total">@L["manual_title"]</p>
+                <p class="field__hint">@L["manual_text"]</p>
...
-<span id="quantity_summary">@Model.Quantity</span> יח׳</span>
+<span id="quantity_summary">@Model.Quantity</span> @L["unit"]</span>
```
После блока too_thick добавить два блока по образцу соседних (та же иконка и ссылка special_description):
`<div class="alert alert--error" data-error="qty_max" ...> ... @L["error_qty_max"] ...` и
`<div class="alert alert--error" data-error="generic" ...> ... @L["error_generic"] ...`.
(data-limits и data-hint нужны для исправления 6; если делаете 2 без 6 — эти два атрибута пока не добавляйте.)

JS — главное (полный файл: wwwroot/js/catalogs.js в 2-front-msg.diff):
```js
const money = v => '‎' + Number(v).toFixed(2) + ' ₪‎';   // «1346.19 ₪» (В7)

function render(result) {
    hideAllErrors();
    const data = result && result.data;
    const status = data && data.status;

    if (status === 'ready') {
        showBlock('prices');
        totalOutput.textContent = money(data.priceIncVatIls);
        vatOutput.textContent = money(data.vatIls);
        unitOutput.textContent = money(data.unitPriceIncVatIls);
        minNote.hidden = !data.minApplied;               // нужно поле minApplied из исправления 4
        setCta(form.dataset.ctaOrder);
        next.href = result.wpmessage;
        setSend(true);
    }
    else if (status === 'manual_quote') {                // Н1: новая ссылка и кнопка «Запросить расчёт»
        showBlock('manual');
        minNote.hidden = true;
        setCta(form.dataset.ctaAsk);
        next.href = result.wpmessage;
        setSend(true);
    }
    else {                                               // ошибка, HTTP 500, не-JSON, нет сети (Н3, Н4, Б4)
        const code = data && data.errorCode;
        const alert = (code && form.querySelector(`[data-error="${CSS.escape(code)}"]`))
            || form.querySelector('[data-error="generic"]');
        alert.hidden = false;
        showBlock('prices');                             // НЕ блок «посчитаем лично»
        clearPrices();                                   // «—»
        minNote.hidden = true;
        setCta(form.dataset.ctaOrder);
        setSend(false);
    }
}

async function triggerCalculation() {
    controller?.abort();
    controller = new AbortController();
    const myRequest = ++lastRequest;
    priceBox.classList.add('is-pending');                // М4: цена приглушена, кнопка неактивна
    setSend(false);

    let result = null;
    try {
        const response = await fetch('?handler=Calculate', { method: 'POST', headers: {...}, body: new FormData(form), signal: controller.signal });
        // JSON читаем при любом статусе, в том числе 400 (если сервер начнёт отдавать 400, см. исправление 9)
        const type = response.headers.get('content-type') || '';
        if (type.includes('application/json'))
            result = await response.json();
    }
    catch (error) {
        if (error.name === 'AbortError') return;         // уже идёт более новый запрос
    }
    if (myRequest !== lastRequest) return;               // старый ответ не перезаписывает новый
    priceBox.classList.remove('is-pending');
    render(result);                                      // result === null → ветка ошибки, текст generic
}

// М5: и при первой загрузке, и при «Назад», без проверки persisted (ТЗ §4)
window.addEventListener('pageshow', () => { updateUIElements(); applyPageLimits(true); triggerCalculation(); });
```
setCta меняет текст и у `#calc-next [data-cta]`, и у `#calc-next-off`. В wwwroot/css/components.css одна строка:
`.price-box.is-pending { opacity: .5; transition: opacity .15s; }`.
Отдельный вызов `triggerCalculation();` в конце скрипта убрать: pageshow срабатывает и при первой загрузке, иначе будет два запроса.

Как проверить (вручную или Playwright, he и ru):
- T09 из интерфейса: 12 стр. → цена; затем тираж 150 и 36 стр. → блок «Рассчитаем индивидуально», кнопка «Запросить расчёт в WhatsApp»,
  в ссылке строка «Прошу рассчитать цену», а не прошлая цена (Н1). Проверено: he/ru OK.
- После этого тираж 5 → текст qty_min, «—», кнопка выключена, блока «посчитаем лично» нет (Н3). Затем 5000 → снова кнопка «Запросить» (было: оставалась выключенной).
- Пустой тираж → текст generic (Н4). Тираж 100 001 → текст qty_max (V15).
- /ru: ни одного слова на иврите в блоке цены.
- Подменить ответ сервера (DevTools → Network → Override, или Playwright route): HTML 500 → «—», generic, кнопка выключена;
  JSON 400 с errorCode pages_step → текст pages_step; обрыв сети → generic. Проверено.
- «Назад» с другой страницы → цена пересчитана (М5).

----------------------------------------------------------------------------------------------------

## Исправление 3 (В). Числа формулы — в appsettings.json, секция Catalogs (IOptions)

Закрывает: В1 (§3 «все значения … в настройках продукта, appsettings.json, секция Catalogs»; §3.2 «в коде их нет»).
Без этого нельзя провести T12 и T13 (тестовый конфиг).

Где: Services/CatalogCalculatorService.cs:13–16 (константы), :19–27 (бумага), :31–46 (форматы и спирали); appsettings.json (секции нет);
Program.cs:51 (регистрация сервиса).

Что сделать:
1. Новый файл Services/CatalogSettings.cs — классы с теми же именами, что ключи в §3.1 (CatalogSettings, CatalogPaperSettings,
   CatalogFormatSettings, CatalogSpiralSettings) и проверка полноты IsComplete().
2. В appsettings.json добавить секцию "Catalogs" со значениями из §3.1 (весь блок — в 3-settings.diff).
3. В сервисе константы и switch-таблицы заменить на поле `S` из настроек; конструктор принимает IOptions<CatalogSettings>.
4. В Program.cs связать секцию и проверять её при старте.

Код:
```csharp
// Services/CatalogSettings.cs (фрагмент)
public class CatalogSettings
{
    public Dictionary<int, CatalogPaperSettings> Papers { get; set; } = new();          // ключ = граммы
    public Dictionary<CatalogSize, CatalogFormatSettings> Formats { get; set; } = new(); // ключ = A4/A5/A6
    public List<CatalogSpiralSettings> Spirals { get; set; } = new();
    public decimal ClickColorIls { get; set; }
    // ... LaminationUsdPerM2, UsdRateIls, SheetAreaM2, StaplesPerCopyIls, PunchSec, SpiralCloseSec,
    //     LaborRateIlsPerHour, WasteRate, MarkupThresholdIls, MarkupLow, MarkupHigh, MinOrderIls,
    //     MaxAutoPriceIls, MaxQuantity, VatRate — все из §3.1
    public bool IsComplete() =>
        GetInnerPaperSizes().Concat(GetCoverPaperSizes()).All(Papers.ContainsKey)
        && Enum.GetValues<CatalogSize>().All(Formats.ContainsKey)
        && Spirals.Count > 0 && MaxQuantity > 0;
}
```
```json
"Catalogs": {
  "Papers": {
    "80":  { "SheetPriceIls": 0.091,   "ThicknessMm": 0.10,  "SheetsPerPunch": 20, "StapleMaxPages": 36, "SpiralMaxPages": 200 },
    "130": { "SheetPriceIls": 0.1485,  "ThicknessMm": 0.115, "SheetsPerPunch": 17, "StapleMaxPages": 36, "SpiralMaxPages": 150 },
    "170": { "SheetPriceIls": 0.197,   "ThicknessMm": 0.15,  "SheetsPerPunch": 13, "StapleMaxPages": 8,  "SpiralMaxPages": 120 },
    "250": { "SheetPriceIls": 0.29322, "ThicknessMm": 0.24,  "SheetsPerPunch": 8,  "StapleMaxPages": 8,  "SpiralMaxPages": 60 },
    "300": { "SheetPriceIls": 0.35216, "ThicknessMm": 0.29,  "SheetsPerPunch": 6,  "StapleMaxPages": 0,  "SpiralMaxPages": 60 }
  },
  "Formats": { "A4": { "PagesPerSheet": 4, "CoversPerSheet": 1, "SpiralLengthFactor": 1 }, "A5": {...8, 2, 0.71}, "A6": {...16, 4, 0.5} },
  "Spirals": [ { "Name": "3/8", "DiameterMm": 9.5, "MaxThicknessMm": 7, "PriceA4Ils": 0.80 }, ... 7/16, 9/16, 5/8 ],
  "ClickColorIls": 0.13325, "LaminationUsdPerM2": 0.37, "UsdRateIls": 3.3, "SheetAreaM2": 0.16104, "StaplesPerCopyIls": 0.50,
  "PunchSec": 30, "SpiralCloseSec": 30, "LaborRateIlsPerHour": 200, "WasteRate": 0.10,
  "MarkupThresholdIls": 200, "MarkupLow": 5, "MarkupHigh": 4.5, "MinOrderIls": 100, "MaxAutoPriceIls": 2000,
  "MaxQuantity": 100000, "VatRate": 0.18
}
```
```diff
 // Services/CatalogCalculatorService.cs
-        const decimal ClickColorIls = 0.13325m, UsdRateIls = 3.3m, StaplesPerCopyIls = 0.5m;
-        ... (все const, GetPaperInfo-switch, CatalogSizeInfo, Spirals[])
+        // все числа формулы — из appsettings.json, секция "Catalogs" (ТЗ §3.1)
+        private readonly CatalogSettings S;
+        public CatalogCalculatorService(IOptions<CatalogSettings> options) => S = options.Value;
+
+        private CatalogPaperSettings GetPaperInfo(int paper) =>
+            S.Papers.TryGetValue(paper, out var p) ? p : throw new ArgumentOutOfRangeException(nameof(paper), paper, "Unsupported paper weight");
 ...
-        public static int GetPagesMax(...)          +        public int GetPagesMax(...)        // теперь читает конфиг
-            if (quantity > MaxQuantity)              +            if (quantity > S.MaxQuantity)
-            CatalogSizeInfo format = GetSizeInfo(req.Format);   +   var format = S.Formats[req.Format];
-            ... ClickColorIls ... Spirals.OrderBy ... MinOrderIls ...
+            ... S.ClickColorIls ... S.Spirals.OrderBy ... S.MinOrderIls ...   (в Calculate — перед каждым числом «S.»)
```
```diff
 // Program.cs
+            builder.Services.AddOptions<CatalogSettings>()
+                .Bind(builder.Configuration.GetSection("Catalogs"))
+                .Validate(s => s.IsComplete(), "appsettings.json: секция Catalogs неполная")
+                .ValidateOnStart();
             builder.Services.AddSingleton<CatalogCalculatorService>();
```
Список весов бумаги (80…300) и форм печати оставлен в коде как список продукта (§1); цены и пределы для них — в конфиге.
MinQuantity = 6, шаги и минимумы страниц в §3.1 не перечислены, поэтому остались в коде (ТЗ тут молчит).
Замечание: с IOptions новые значения применяются после перезапуска приложения (на Azure смена App Settings перезапускает сайт сама).
Если нужно без перезапуска при правке файла — IOptionsMonitor; ТЗ этого не требует.

Как проверить: T01–T11 дают те же числа (проверено на копии); T12 и T13 — юнит-тестами (исправление 5) с изменённым конфигом;
вручную: поменять в appsettings.json "MinOrderIls": 2000, перезапустить, T01 → 2000,00 / 2360,00 (T13); вернуть 100.
Удалить из конфига, например, "250" → сайт не стартует с понятной ошибкой (ValidateOnStart).

----------------------------------------------------------------------------------------------------

## Исправление 4 (В). Округление AwayFromZero; minApplied и spiralMm в ответе

Закрывает: В2 (§3.2 «Округление только в шагах 12 и 14, MidpointRounding.AwayFromZero»; A5 8 стр. без обл. 100 шт. давало 593,83 вместо 593,84),
часть В9 (§5: в data должны быть minApplied и spiralMm; без minApplied строка «Минимальный заказ 118 ₪» (cshtml:259) никогда не показывается).

Где: Services/CatalogCalculatorService.cs:106, :111, :113, :115–123; Data/CatalogQuoteResponse.cs:9–12.

Код:
```diff
-            decimal calculatedPrice = Math.Round(costWithWaste * markup, 2);
+            decimal calculatedPrice = Math.Round(costWithWaste * markup, 2, MidpointRounding.AwayFromZero);
-            decimal vat = Math.Round(priceExVat * VatRate, 2);
+            decimal vat = Math.Round(priceExVat * VatRate, 2, MidpointRounding.AwayFromZero);
-            decimal pricePerCopy = Math.Round(priceIncVat / req.Quantity, 2);
+            decimal pricePerCopy = Math.Round(priceIncVat / req.Quantity, 2, MidpointRounding.AwayFromZero);
 ...
                 UnitPriceIncVatIls = pricePerCopy,
+                MinApplied = minApplied,
+                SpiralMm = spiralDiameterMm,   // для скобы null (ТЗ §5)
```
```diff
 // Data/CatalogQuoteResponse.cs
         public decimal? UnitPriceIncVatIls { get; set; }
+        public bool MinApplied { get; set; }
+        public decimal? SpiralMm { get; set; }
```
(Так же, с AwayFromZero, уже сделано у наклеек: StickerCalculatorService.cs:127, :131.)

Как проверить: A5, скоба, 8 стр. 130 г, без обложки, 100 шт. → 503,25 / 593,84 (проверено; было 593,83).
T04 → minApplied: true и на странице видна строка «Минимальный заказ 118 ₪ с НДС» (проверено). T03 → spiralMm 9.5; скоба → null.
Мелочь: в §10 у T03 примечание «спираль 9 мм», а по §3.1 это спираль 3/8" = 9,5 мм; код отдаёт 9.5 (диаметр из конфига).

----------------------------------------------------------------------------------------------------

## Исправление 5 (В). Юнит-тесты T01–T13 и V01–V16

Закрывает: В10 (§5 «Сервис … с юнит-тестами T01–T13 и V01–V16», §9.5 «юнит-тесты зелёные»).

Что сделать:
1. `dotnet new xunit -o PrintABC.Tests` в корне репозитория.
2. ВАЖНО: проект сайта лежит в корне, и без исключения он начнёт компилировать файлы тестов как часть сайта (ошибки сборки).
   В PrintABC.csproj:
   ```xml
   <ItemGroup>
     <!-- папка тестов лежит внутри проекта сайта: не компилировать её в сайт -->
     <Compile Remove="PrintABC.Tests\**" />
     <Content Remove="PrintABC.Tests\**" />
     <None Remove="PrintABC.Tests\**" />
   </ItemGroup>
   ```
3. В PrintABC.Tests.csproj: `<ProjectReference Include="..\PrintABC.csproj" />` и
   `<None Include="..\appsettings.json" Link="appsettings.json" CopyToOutputDirectory="PreserveNewest" />` — тесты читают настоящий конфиг.
4. В PrintABC.slnx добавить `<Project Path="PrintABC.Tests/PrintABC.Tests.csproj" />`.
5. Файл тестов PrintABC.Tests/CatalogCalculatorServiceTests.cs — целиком в 5-tests.diff. Схема:
   ```csharp
   private static CatalogCalculatorService Svc(Action<CatalogSettings>? change = null)
   {
       var s = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetSection("Catalogs").Get<CatalogSettings>()!;
       change?.Invoke(s);                               // T12/T13: тестовый конфиг
       return new CatalogCalculatorService(Options.Create(s));
   }
   // [Theory] T01–T11: ValidateInput → Calculate → сравнить PriceExVatIls, PriceIncVatIls, MinApplied
   // [Fact]   T09 manual_quote; T12 too_thick; T13 MinOrderIls = 2000 → 2000,00 / 2360,00, MinApplied
   // [Theory] V01–V16: ValidateInput возвращает ожидаемый код
   ```
6. Запуск: `dotnet test PrintABC.Tests -c Release`. На копии: Passed 39, Failed 0.

Найдено при написании тестов (вопрос автору ТЗ): T12 в §10 говорит «все MaxThickness = 1 мм; A4, спираль, 20 стр. 80 г, без обл.».
Толщина по §3.2 п.7: 20/2 × 0,10 = 1,00 мм, а правило «T ≤ MaxThickness» значит, что 1,00 мм в спираль 1 мм ВЛЕЗАЕТ — too_thick не будет.
В тесте взято 0,9 мм (с комментарием). Нужно поправить §10 (0,9 мм или 22 стр.) либо правило на «T < Max».

----------------------------------------------------------------------------------------------------

## Исправление 6 (В). Пределы, шаг и подсказка у поля страниц

Закрывает: В3 (§2 «поле страниц меняет шаг, min и max при смене переплёта, бумаги и обложки; значение приводится к ближайшему
допустимому; 300 г при скобе неактивна, при переключении на скобу выбирается 250 г»; §4 подсказка «Скоба, 130 г: от 8 до 36 стр., кратно 4»).

Где: Pages/Catalogs.cshtml:114 (жёстко min=4 max=36 step=4), :115 (подсказка «?»).

Что сделать:
1. В PageModel отдать пределы в JS одной строкой JSON (числа берутся из сервиса, т. е. из конфига — второй копии таблицы в JS нет):
```csharp
// Pages/Catalogs.cshtml.cs (+ using System.Text.Json;)
public string PageLimitsJson => JsonSerializer.Serialize(
    Enum.GetValues<CatalogBinding>().ToDictionary(
        b => b.ToString(),
        b => new
        {
            step = GetPagesStep(b),
            minCover = GetPagesMin(b, true),
            minNoCover = GetPagesMin(b, false),
            max = GetInnerPaperSizes().ToDictionary(g => g.ToString(), g => catalogCalculatorService.GetPagesMax(b, g))
        }));
```
2. cshtml: атрибуты data-limits и data-hint на форме (см. исправление 2), `value="@Model.InnerPageCount"`, подсказку `<p ... data-pages-hint=""></p>` пустой (её заполняет JS).
3. JS (applyPageLimits в catalogs.js): по выбранным Binding / InnerPaper / HasCover ставит min, max, step; отключает бумагу с max = 0
   (300 г при скобе) и при необходимости выбирает 250 г; при смене этих трёх радиокнопок (событие change) приводит число к ближайшему
   допустимому; подставляет подсказку из data-hint. Во время набора числа значение не трогаем (иначе «1» при наборе «12» сразу станет 8),
   ошибку покажет сервер.
4. Заодно (М-мелочь): радиокнопки печати обложки ставить по модели — `checked="@(Model.CoverPrint == "40")"` / `"44"`, а не жёсткий `checked=""`.
5. Пока обложки нет, поля обложки отключать (`disabled`), чтобы они не уходили на сервер (§4 «в расчёт не уходит»); сервер их и так не проверяет.

Как проверить: скоба + 130 г + с обложкой → «Скоба, 130 г: от 4 до 36 стр., кратно 4», 300 г неактивна; без обложки → от 8;
спираль → 20–200, шаг 2, 300 г активна; спираль 300 г 60 стр. → переключить на скобу → бумага 250 г, страниц 8 («от 4 до 8»).
Проверено Playwright на he и ru.

----------------------------------------------------------------------------------------------------

## Исправление 7 (В). Скрипт — в wwwroot/js/catalogs.js

Закрывает: В11 (§9.1 «JS в wwwroot/js/catalogs.js, без inline-скриптов (CSP), тексты через data-*»).
Где: Pages/Catalogs.cshtml:378–510.
Что сделать: весь `<script>` из секции Scripts перенести в wwwroot/js/catalogs.js (обернуть в `(function () { ... })();`), в cshtml оставить
```html
@section Scripts {
    <script src="~/js/catalogs.js" asp-append-version="true"></script>
}
```
Все тексты для JS — только через data-* на форме (data-cta-order, data-cta-ask, data-hint …), в JS-файле нет ни одного русского или ивритского слова.
Как проверить: в исходнике страницы нет `<script>` без src; при включённом CSP `script-src 'self'` (Program.cs:94–106, вопрос 10 агента 6)
калькулятор продолжает считать.

----------------------------------------------------------------------------------------------------

## Исправление 8 (В7, М1, М2). Формат цены и кодирование сообщения WhatsApp

Где: страница — бывшие cshtml:455–457 (`priceIncVatIls + '₪'`, НДС и за штуку без ₪); сообщение — Pages/Catalogs.cshtml.cs:86 (`%0a`),
:95 (`4%2B4`), :110 (`{price}₪`); resx msg_file_whatsapp (ru и he: «%0a %F0%9F%93%8E%20» внутри текста).

Страница: функция money() из исправления 2 → «1346.19 ₪», «205.35 ₪», «13.46 ₪», в LRM, как в исходной разметке.

Сообщение (§6: `Uri.EscapeDataString(текст)`, цена «1346.19 ₪», в иврите в LRM):
```diff
-            string newline = "%0a";
+            string newline = "\n";   // кодируем всё сообщение один раз в конце
-                string coverprint = (CoverPrint == "44") ? "4%2B4" : "4%2B0";
+                string coverprint = (CoverPrint == "44") ? "4+4" : "4+0";
 ...
-                sb.Append($"{L["msg_price"]}: {response.PriceIncVatIls}₪ {L["msg_with_vat"]}");
+            {
+                // «1346.19 ₪» (ТЗ §6); в иврите число в LRM, чтобы не переворачивалось
+                string price = $"{response.PriceIncVatIls!.Value.ToString("0.00", CultureInfo.InvariantCulture)} ₪";
+                if (CultureInfo.CurrentUICulture.TextInfo.IsRightToLeft)
+                    price = "‎" + price + "‎";
+                sb.Append($"{L["msg_price"]}: {price} {L["msg_with_vat"]}");
+            }
 ...
-            WhatsappMessage = sb.ToString();
+            WhatsappMessage = Uri.EscapeDataString(sb.ToString());
```
resx: убрать из msg_file_whatsapp закодированные куски (М2 — из-за «%0a» скрепка уезжала на новую строку):
- ru: «Файл макета пришлю следом через 📎 → «Документ» (не «Галерея»).»
- he: «את קובץ ההדפסה אשלח מיד דרך 📎 ← "מסמך" (לא "גלריה").»
(Ключ общий только для каталогов; у наклеек свой resx, их не трогаем.)

Не входит (вопрос владельцу, М1): §6 требует `https://wa.me/<номер>?text=`, а общая константа Helpers.cs:21 WHATSAPP_URL =
api.whatsapp.com/send для всего сайта (вопрос 2 агента 6). EscapeDataString работает с обоими адресами; менять константу — решение владельца,
т. к. затронет наклейки.

Как проверить: декодировать ссылку кнопки (decodeURIComponent) и сравнить с §6 построчно. На копии:
ru «Цена: 1346.19 ₪ с НДС», he «מחיר: ‎1346.19 ₪‎ כולל מע״מ», manual_quote «Прошу рассчитать цену» / «אבקש הצעת מחיר», «4+4» без %2B,
скрепка на той же строке. Остаётся М3 (см. п. 12): «Блок: 12 стр., 130 г» вместо «мелованная матовая 130 г».

----------------------------------------------------------------------------------------------------

## Исправление 9 (В9, остаток). HTTP 400 и формат ответа — ВОПРОС ВЛАДЕЛЬЦУ

§5: ошибка = `{ "success": false, "errorCode": "…" }` с HTTP 400, успех = плоский `{ success, status, data{priceExVat, vat, …}, wpmessage }`.
Сейчас (и после патчей 1–8) формат как у наклеек: `{ success, data{ status, errorCode, priceExVatIls, … }, wpmessage }`, ошибки с HTTP 200.
Это открытый вопрос 1 агента 6. Варианты:

А. Оставить формат как у наклеек, но отдавать ошибки с 400 (минимально, JS из исправления 2 уже читает JSON при 400 — проверено):
```diff
-                return new JsonResult(new { success = false, data = CatalogQuoteResponse.Error(errorCode) });
+                return new JsonResult(new { success = false, data = CatalogQuoteResponse.Error(errorCode) }) { StatusCode = 400 };
 ...
-                return new JsonResult(new { success = false, data = response });
+                return new JsonResult(new { success = false, data = response }) { StatusCode = 400 };
```
Б. Строго по §5 (плоский ответ, имена priceExVat/vat/priceIncVat/pricePerCopyIncVat): поменять анонимные объекты в OnPostCalculate,
например `new { success = false, errorCode }` и `new { success = true, status = "ready", data = new { priceExVat = r.PriceExVatIls, vat = r.VatIls, priceIncVat = r.PriceIncVatIls, pricePerCopyIncVat = r.UnitPriceIncVatIls, minApplied = r.MinApplied, spiralMm = r.SpiralMm }, wpmessage }`,
и в JS читать `result.status`, `result.errorCode`, `result.data.priceIncVat` и т. д. Расходится с наклейками.
Рекомендация: А сейчас (полчаса), Б — только если владелец подтвердит §5 буквально.
Как проверить: V01–V16 → HTTP 400 (curl -w "%{http_code}"), страница показывает те же тексты ошибок.

----------------------------------------------------------------------------------------------------

## Исправление 10 (В6, М6). Нижняя панель на телефоне

Где: Pages/Shared/_BottomBar.cshtml:2 (жёстко `href="/stickers"` и текст calculate_stickers); _Layout.cshtml:32 уже передаёт
`model="@ViewData["BottomBar"]"`, но партиал модель не использует; wwwroot/css/base.css:15 `scroll-padding-bottom: 16px`.
§4: «снизу закреплённая панель „Итого … Заказать →“ (параметр страницы, не жёстко /stickers в _BottomBar), scroll-padding-bottom
не меньше высоты панели»; «в нижней панели кнопка „Исправить параметры“ прокручивает к ошибке».

Что сделать (набросок, на копии не опробован):
1. Маленький класс модели, например `public record BottomBarModel(string Href, string Text, bool ShowTotal);` в Utils.
2. В _BottomBar.cshtml: `@model BottomBarModel?`, `href="@(Model?.Href ?? "/stickers")"`, текст `@(Model?.Text ?? L["calculate_stickers"])`;
   если ShowTotal — перед кнопкой `<span class="bottom-bar__price"><span class="bottom-bar__label">…Итого</span><output class="bottom-bar__total" data-bar-total>—</output></span>`
   (CSS-классы bottom-bar__price/label/total уже есть в layout.css:103–105).
3. В Catalogs.cshtml: `ViewData["BottomBar"] = new BottomBarModel("#calc-form", L["bar_order"].Value, true);`.
4. В catalogs.js в render(): копировать итог в `[data-bar-total]`; при ошибке менять текст кнопки на «Исправить параметры» и href на `#` + id блока ошибки.
5. base.css:15 → `scroll-padding-bottom: calc(var(--bar-h) + 16px);` в мобильном media-запросе (--bar-h уже используется в layout.css:136).
Тексты кнопок («Заказать →», «Исправить параметры», «Итого») взять из макета и добавить в resx — в ТЗ точных строк нет.
Как проверить: ширина 390: панель показывает итог и ведёт к калькулятору; при ошибке — «Исправить параметры» прокручивает к ней;
фокус при Tab не прячется под панелью. Наклейки: панель как раньше.

----------------------------------------------------------------------------------------------------

## Исправление 11 (В8). Превью брошюры

Где: Pages/Catalogs.cshtml:21–67 — разметка cat-preview есть, но в wwwroot/css нет ни одного класса `cat-` (агент 6), подписи
(cshtml:22 aria-label, :63–66 чипы) зашиты на иврите и не меняются.
Что сделать: перенести стили превью из прототипа (§4: доски «Каталоги и журналы + калькулятор» и «Каталоги · телефон») в
wwwroot/css/pages.css; в catalogs.js в updateUIElements() ставить `data-fmt`/`data-binding` у `.cat-book` и текст чипов из выбранных
опций (подписи — через data-* из resx); на телефоне калькулятор выше превью (§4). Пропорции по формату: у A4/A5/A6 одинаковое
отношение сторон 1:√2, поэтому «меняет пропорции» на практике — размер/подпись; уточнить по макету.
Время 4–6 ч, это вёрстка по макету, код здесь не привожу.
Как проверить: сравнить с макетом на 390 / 1366 он/ру; смена формата и переплёта меняет превью и подписи; на /ru подписи по-русски.

----------------------------------------------------------------------------------------------------

## 12. Мелочи (М), кратко

- М3 (бумага в сообщении «130 г» вместо «мелованная матовая 130 г», §6): добавить ключи msg_paper_80 … msg_paper_300
  (ru «офсет 80 г», «мелованная матовая 130 г» …; he «נייר 80 גרם», «כרומו מט 130 גרם» …) и в CreateMessage брать их вместо innerpaper_*.
  Там же: обложка выходит «Мелованная матовая 250 г» с заглавной (cover_paper_hint) — в §6 строчная. 20 мин.
- М8 (телефон литералом в cshtml: `https://wa.me/972508494172` 6 раз): заменить на `https://wa.me/@PHONE_NUMBER` (константа уже есть, Helpers.cs:19). 10 мин.
- М10 (CS8602): закрыто исправлением 1 (`response!`), сборка без предупреждений.
- М11 (§9.4): Helpers.cs:16 добавить `Catalogs = 1,` в enum OrderType. 2 мин. Где он используется — в ТЗ не сказано.
- М12 (кавычки «…» в тексте кнопки): resx next_load_file ru «Заказать в WhatsApp», he «להזמנה ב-WhatsApp» без ёлочек. 2 мин.
- М13 (cshtml:82 `<span class="@isRtl">` → на he выходит class="class"): видимо, имелось в виду `class="ltr"` для размера «21×29.7»
  (класс .ltr есть в base.css:111) — `<span class="ltr">`. 5 мин.
- М14 (size_A4 = «21×29.7» в ru resx): привести к макету (например «21×29,7» или в мм 210×297 как в §1) — точной строки в ТЗ нет, по макету. 5 мин.
- М15 (стартовые цены 1346.19 / 205.35 / 13.46 зашиты в cshtml:249, 253, 257): поставить «—», цену всё равно сразу пересчитывает JS;
  либо считать на сервере в OnGet. 10 мин.
- М4, М5, М7, М2 — закрыты исправлениями 2 и 8. М1 — частично (кодирование), домен wa.me — вопрос владельцу. М6 — в исправлении 10.

## Вопросы владельцу / автору ТЗ, всплывшие при исправлении

1. Формат ответа и HTTP 400 (исправление 9): как у наклеек или строго §5.
2. Шаг страниц спирали 2 или 4 (патч следует ТЗ: 2).
3. coverPrint в API: «40/44» (как шлёт форма) или «4+0/4+4» (как в §5).
4. Тексты для qty_max, generic (и при желании для каждого bad_*): в ТЗ их нет; черновики в исправлении 2, he — вычитать.
5. T12: при MaxThickness = 1 мм и толщине ровно 1,00 мм too_thick по правилу «≤» не возникает — поправить тест или правило.
6. wa.me против общего api.whatsapp.com (влияет на весь сайт).
