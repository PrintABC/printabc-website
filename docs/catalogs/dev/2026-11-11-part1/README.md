# Страница «Каталоги»: что починить после проверки 11.11.2026

Для кого: разработчик сайта PrintABC. Код: ветка `feature/initial-site`, коммит **aa9879e**.
Откуда замечания: проверка глазами клиента (`docs/reviews/2026-11-11-catalogs-uzer-review.md`) и визуальная проверка (`.../2026-11-11-catalogs-visual-review.md`). Скриншоты: `code-review/2026-11-11-catalogs-ux-img/` (внутренний файл, в репозитории нет).

Все исправления уже написаны и проверены: сайт собирается без предупреждений, страница проверена в браузере (iPhone 13 и десктоп 1366, he и ru). Готовые патчи лежат в папке `patches/`.

Что здесь **не** делаем (решает владелец отдельно): порог 2 360 ₪, пункт «Каталоги» в меню, молчаливая смена числа страниц, фото бумаги, текст про доставку, сброс формы кнопкой «Назад».

---

## Как применить

Проще всего применить всё одним файлом:

```bash
git checkout feature/initial-site        # HEAD должен быть aa9879e
git apply --check docs/catalogs/dev/2026-11-11-part1/patches/all.diff   # ничего не пишет = всё ок
git apply docs/catalogs/dev/2026-11-11-part1/patches/all.diff
dotnet build -c Release                  # 0 Warning(s), 0 Error(s)
```

Файлы `01-…` – `09-…` — это те же изменения, разложенные по пунктам, чтобы было удобно читать и делать коммиты по одному. **Применять их нужно по порядку** (01, потом 02, …): все они правят один и тот же скрипт в `Catalogs.cshtml` и дописывают строки в конец одних и тех же `.resx`, поэтому, например, 05 без 01–04 не встанет. На aa9879e отдельно встают 01 и 03, весь набор по порядку и `all.diff` встают чисто (проверено `git apply --check`).

Можно делать коммит после каждого патча:

```bash
for p in docs/catalogs/dev/2026-11-11-part1/patches/0*.diff; do
  git apply "$p" && git add -A && git commit -m "catalogs: $(basename "$p" .diff)"
done
```

Как запускать для проверки: `dotnet run -c Release --urls http://localhost:5131` (именно `dotnet run` из папки проекта; если запустить готовый dll из другой папки, css/js придут пустые). Телефон смотреть в Chrome → F12 → значок телефона → iPhone 12/13 (390 px).

## Сводка по приоритету

| # | Что | Патч | Время |
|---|---|---|---|
| 1 | «По запросу»: кнопка шлёт старый заказ со старой ценой | 01-manual-quote.diff | 30 мин |
| 2 | Нижняя панель и кнопка в шапке ведут на наклейки | 02-bottom-bar.diff | 1 ч |
| 3 | Ошибка появляется на 800 px ниже поля | 03-error-next-to-field.diff | 30 мин |
| 4 | Пустое поле и 5.5: цена пропадает без слов | 04-empty-and-fraction.diff | 45 мин |
| 5 | Иврит на русской странице | 05-hebrew-on-ru.diff | 30 мин |
| 6 | «Ваш заказ» показывает обложку при «без обложки» | 06-order-summary.diff | 30 мин |
| 7 | Превью брошюры — голый текст, группы обложки слиплись | 07-preview.diff | 1 ч |
| 8 | Формат цены «1346.19₪», НДС и цена за штуку без ₪ | 08-price-format.diff | 30 мин |
| 9 | Бумага 300 г при скобе не выглядит неактивной | 09-paper-300-disabled.diff | 15 мин |
| | Итого | all.diff | ~5,5 ч своими руками, ~1,5 ч если применить патч и проверить |

Номера строк ниже указаны по коду **aa9879e** (до исправлений).

---

## 1. «По запросу»: кнопка «Заказать» шлёт старый заказ — `01-manual-quote.diff`

**Проблема.** Если заказ дороже 2 360 ₪ (например, 32 стр. × 200 шт.), вместо цены написано «Рассчитаем индивидуально», но зелёная кнопка «Заказать в WhatsApp» остаётся. Нажимаешь — в WhatsApp уходит **предыдущий** выбор с чужой ценой («12 стр., 100 шт., 1346.19 ₪»). Скриншоты `uzer-s2-result-he-desktop.png`, `uzer-s3-result-he-phone.png`, `uzer-s4-5000-ru-desktop.png`.

**Причина.** Коммит 34f48ec исправил только сервер: `Catalogs.cshtml.cs:109-110` правильно пишет «Прошу рассчитать цену», и ответ сервера несёт новую ссылку `wpmessage`. Но скрипт на странице эту ссылку **не берёт**. В `Pages/Catalogs.cshtml:494-496` ветка `manual_quote` только прячет цену:

```js
if (result.data.status == "manual_quote") {
    toggleInvalidPrices(true);          // и всё: href кнопки не меняется
}
```

Ссылка кнопки меняется только в ветке «цена готова» (строка 511). Значит, в кнопке остаётся ссылка от последнего удачного расчёта. Подпись кнопки тоже нигде не меняется на «Запросить расчёт».
Вторая дыра: пока ждём ответа (300 мс + запрос), кнопка тоже держит старую ссылку.

**Решение.**

```js
// было
if (result.data.status == "manual_quote") {
    toggleInvalidPrices(true);
}

// стало
if (result.data.status == "manual_quote") {
    //no price, but the client can still send the CURRENT parameters and ask for a quote
    toggleInvalidPrices(true);
    setCta(true);                                              // «Запросить расчёт в WhatsApp»
    document.getElementById('calc-next').href = result.wpmessage;
    setSend(true);
}
```

Плюс:
- новая функция `setCta(manual)` меняет подпись кнопки; тексты лежат в `data-text-order` / `data-text-manual` у `<span data-cta>` (берутся из resx, в JS текста нет);
- в ветке с ценой вызывается `setCta(false)`, чтобы вернуть «Заказать в WhatsApp»;
- `form.addEventListener('input', () => setSend(false));` — при любом изменении формы кнопка сразу прячется (вместо неё серая неактивная) и появляется только с новым ответом. Так старую ссылку нажать нельзя совсем. Это и требует ТЗ §4: «Пока ждём ответ, … кнопка заказа неактивна».
- resx: новый ключ `cta_manual` («Запросить расчёт в WhatsApp» / «לבקשת הצעת מחיר ב-WhatsApp»); у `next_load_file` убраны кавычки-ёлочки («Заказать в WhatsApp» выглядело как цитата).

**Как проверить.** /ru/catalogs: A4, скоба, 130 г, 32 стр., обложка, ламинация матовая, 200 шт. → «Рассчитаем индивидуально», кнопка «Запросить расчёт в WhatsApp». Наведите на кнопку (или ПКМ → копировать ссылку) и раскодируйте текст: «Количество: 200 шт.», «Блок: 32 стр.», строка «Прошу рассчитать цену», цены нет. Верните 100 шт. → кнопка снова «Заказать в WhatsApp» с ценой. То же на /catalogs (иврит: «אבקש הצעת מחיר»).

---

## 2. Нижняя панель и кнопка в шапке ведут на наклейки — `02-bottom-bar.diff`

**Проблема.** На телефоне внизу «Рассчитать цену наклеек» → /stickers. Клиент на каталогах, а его зовут на другой товар. Цены внизу нет. Кнопка «Рассчитать цену» в шапке (десктоп) тоже ведёт на /stickers. Скриншот `uzer-s3-button-he-phone.png`.

**Причина.** `Pages/Shared/_BottomBar.cshtml:2` — одна жёсткая разметка для всех страниц: `<a class="btn btn--primary" href="/stickers">@L["calculate_stickers"]</a>`. `_Layout.cshtml:32` уже передаёт `ViewData["BottomBar"]`, но панель его не читает. `_Header.cshtml:49` — жёсткое `href="/stickers"`. ТЗ §4: «панель „Итого … Заказать →“ (параметр страницы, не жёстко /stickers в _BottomBar)».

**Решение.** Панель выбирает вид по `ViewData["BottomBar"]`. Если страница ничего не задала — старая панель (наклейки, визитки, главная не меняются).

```cshtml
@{
    //ViewData["BottomBar"] is set by the page: "order" = price bar of a calculator page, nothing = default bar (link to stickers)
    var barMode = ViewData["BottomBar"] as string;
}
...
@if (barMode == "order")
{
    <div class="bottom-bar">
      <div class="bottom-bar__price"><span class="bottom-bar__label">@L["total"]</span>
        <output class="bottom-bar__total" data-bar-total aria-live="polite">— ₪</output></div>
      <a class="btn btn--primary" data-bar-ok href="https://wa.me/@(PHONE_NUMBER)" hidden>@L["order"] <span aria-hidden="true">@L["order_arrow"]</span></a>
      <a class="btn btn--secondary" data-bar-fix href="#calc-form" hidden>@L["fix_params"]</a>
      (кнопка WhatsApp как была)
    </div>
}
else
{
    (старая строка без изменений)
}
```

(Кнопку телефона в этом виде убрали, как в макете: на 390 px четыре кнопки не помещаются, телефон обрезался.)

В `Catalogs.cshtml` сверху:

```cshtml
ViewData["BottomBar"] = "order";
ViewData["HeaderCtaHref"] = "#calc-form";
```

В `_Header.cshtml`: `href="@(ViewData["HeaderCtaHref"] as string ?? "/stickers")"` — на каталогах кнопка шапки прокручивает к калькулятору, на остальных страницах всё как было. (Тег-хелпер `LocalizedAnchorTagHelper` ссылки с `#` не трогает, а `/stickers` на /ru сам превращает в `/ru/stickers`.)

В скрипте страницы функция `updateBar()` копирует в панель итог (`#calc-total`), ссылку и видимость главной кнопки; при «по запросу» пишет «по запросу»; при ошибке вместо «Заказать →» показывает «Исправить параметры», а клик по ней плавно прокручивает к показанной ошибке. `updateBar()` вызывается в `setSend()` и в конце `triggerCalculation()`.

В `layout.css` (блок телефона) добавлено `html { scroll-padding-bottom: calc(var(--bar-h) + 16px); }` — поле, к которому прокрутили, не прячется под панелью (ТЗ §4).

Новые ключи: `_BottomBar.{ru,he}.resx` — `total`, `order`, `order_arrow` (→ / ←), `fix_params`; `Catalogs.{ru,he}.resx` — `by_quote` («по запросу» / «לפי הצעה»).

**Как проверить.** Телефон, /ru/catalogs: внизу «Итого 1346.19 ₪ | Заказать →», ссылка «Заказать» та же, что у зелёной кнопки в форме. Поменяйте тираж — сумма внизу меняется. 200 шт. и 32 стр. → «Итого по запросу». 7 стр. → «Исправить параметры», нажать — экран едет к ошибке. Открыть /ru/stickers и /ru/business-cards — внизу по-прежнему «Рассчитать цену наклеек». Десктоп /ru/catalogs: «Рассчитать цену» в шапке прокручивает к форме.

---

## 3. Ошибка появляется далеко под полем — `03-error-next-to-field.diff`

**Проблема.** Ввёл 7 страниц — цена стала «—», а сообщение «Такое число страниц не подходит по шагу» появилось на ~800 px ниже поля, за экраном. На телефоне клиент его не видит. Скриншот `uzer-s5-pages7-ru-phone.png`.

**Причина.** Все блоки ошибок стоят в одном месте, после поля «Количество» (`Pages/Catalogs.cshtml:181-254`), а поле страниц — на строках 112-119. Между ними вся форма обложки. Рамка поля тоже не краснеет: `aria-invalid` всегда `false`, хотя стиль для `true` есть (`components.css:122`).

**Решение.** Перенести ошибки к своим полям, внутрь их `<div class="field">`, сразу после подсказки:
- `pages_step`, `pages_min`, `pages_max`, `too_thick`, `bad_paper` → под полем «Страниц в блоке»;
- `qty_min` → под полем «Количество».

Разметку самих ошибок не меняли, только место. В скрипте:

```js
// было
if (targetError)
    targetError.hidden = false; //unhide the correct error message

// стало
if (targetError)
    showError(targetError); //unhide the correct error message

//shows the error under its field and paints the field red
function showError(alert) {
    alert.hidden = false;
    const input = alert.closest('.field')?.querySelector('input');
    input?.setAttribute('aria-invalid', 'true');
}
```

`hideAllErrors()` теперь ещё и сбрасывает `aria-invalid` у обоих полей. Поле с ошибкой получает красную рамку, экранная читалка говорит «недопустимое значение».

**Как проверить.** Телефон, /ru/catalogs, страниц 7 → красная рамка у поля и сообщение прямо под подсказкой «Шаг 4 стр., …» (в тесте: поле на 834 px, ошибка на 917 px; было 1644 px). Тираж 0 → ошибка прямо под полем тиража.

---

## 4. Пустое поле или 5.5 — цена пропадает молча — `04-empty-and-fraction.diff`

**Проблема.** Стёр число страниц или тиража, или ввёл тираж 5.5 — цена «—», кнопка пропала, никакого сообщения. Ещё и появляется «Рассчитаем индивидуально», хотя это не так. Клиент не понимает, что случилось.

**Причина.**
1. Сервер, `Pages/Catalogs.cshtml.cs:45-53`. `""` и `"5.5"` нельзя записать в `int`, поэтому модель невалидна, а `Quantity` остаётся старым (100). Код смотрит на это старое значение: `Quantity < MIN_QUANTITY ? "qty_min" : "generic"` → `"generic"`. Для `InnerPageCount` тоже всегда `"generic"`.
2. Страница, `Catalogs.cshtml:498-501`: для `"generic"` блока ошибки нет, поэтому ничего не показывается, а `toggleInvalidPrices(true)` включает «Рассчитаем индивидуально».

**Решение.** Сервер смотрит, что клиент реально ввёл (`AttemptedValue`):

```csharp
// было
var code = key switch
{
    "Quantity" => Quantity < MIN_QUANTITY ? "qty_min" : "generic",
    _ => "generic"
};

// стало
//what the client typed: an empty field or "5.5" is not a whole number, the property keeps its old value
string? typed = ModelState[key]?.AttemptedValue;
bool isWholeNumber = int.TryParse(typed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int number);
var code = key switch
{
    nameof(Quantity) => !isWholeNumber ? "qty_int" : number < MIN_QUANTITY ? "qty_min" : "generic",
    nameof(InnerPageCount) => "pages_int",
    _ => "generic"
};
```

(нужен `using System.Globalization;`). Итог: пусто или 5.5 → `qty_int`; 0, −5 → `qty_min`, как раньше; пустые страницы → `pages_int`.

На странице три новых блока ошибки: `pages_int` (под полем страниц), `qty_int` (под тиражом), `generic` (над блоком цены — «Проверьте значения в форме», на всякий случай, чтобы цена никогда не пропадала без слов). В скрипте код ошибки без своего блока показывает `generic`, а ошибка больше не включает «Рассчитаем индивидуально»:

```js
const targetError = (result.data.errorCode)
    ? form.querySelector(`[data-error="${result.data.errorCode}"]`) ?? form.querySelector('[data-error="generic"]')
    : null;
...
if (targetError) {
    showError(targetError);
    toggleInvalidPrices(false); //an error is not "we will calculate individually": show "—"
```

Тексты (resx, ключи `error_pages_int`, `error_qty_int`, `error_generic`):
- ru: «Введите число страниц целым числом, например 12.» / «Введите тираж целым числом, от 6 шт., например 100.» / «Проверьте значения в форме: с ними цену посчитать нельзя.»
- he: «הזינו מספר עמודים שלם, למשל 12.» / «הזינו כמות במספר שלם, מ-6 יח׳ ומעלה, למשל 100.» / «בדקו את הערכים בטופס: איתם אי אפשר לחשב מחיר.»

Ивритские тексты лучше показать Andriy (их писал не носитель языка).

**Как проверить.** Стереть число страниц → «Введите число страниц…» под полем, красная рамка. Тираж 5.5 и пустой тираж → «Введите тираж целым числом…». Тираж 0 → «Минимальный тираж — 6 шт.». «Рассчитаем индивидуально» при этом не появляется. Вернуть 100 → цена снова есть.

---

## 5. Иврит на русской странице — `05-hebrew-on-ru.diff`

**Проблема.** На /ru: на картинке брошюры «קטלוג A4 · 16 עמ׳», под ней «סיכות», «12 עמ׳ · 130 גרם», «כריכה 250 גרם»; в «Ваш заказ» «50 יח׳» вместо «шт.». Скриншоты `uzer-s1-result-ru-phone.png`, `vis-live-ru-390.png`.
(Текст блока «Рассчитаем индивидуально» уже переведён коммитом 34f48ec, там иврита больше нет.)

**Причина.** Текст на иврите вписан прямо в разметку: `Pages/Catalogs.cshtml:22` (aria-label превью), `:42` (`קטלוג`), `:43` (`A4 · 16 עמ׳`), `:62-67` (чипы), `:259` (`יח׳`).

**Решение.** Все слова берём из resx, числа из модели:

```cshtml
@* вверху страницы *@
string bindingText = L[$"binding_{Model.Binding.ToString().ToLower()}"].Value;
string coverChip = Model.HasCover ? $"{L["cover"].Value} {L[$"cover_paper_{Model.CoverPaper}"].Value}" : L["no_cover_short"].Value;

<span class="cat-book__title">@L["preview_title"]</span>
<span class="cat-book__sub" data-cover-sub="">@Model.Format · @(Model.InnerPageCount + (Model.HasCover ? 4 : 0)) @L["page"]</span>
...
<span>@Model.Format</span>
<span>@bindingText</span>
<span>@Model.InnerPageCount @L["page"] · @L[$"innerpaper_{Model.InnerPaper}"]</span>
<span>@coverChip</span>
...
<span id="quantity_summary">@Model.Quantity</span> @L["unit"]
```

Новые ключи: `preview_title` («Каталог» / «קטלוג»), `preview_alt` («Предпросмотр брошюры» / «תצוגה של החוברת»), `no_cover_short` («без отдельной обложки» / «בלי כריכה נפרדת»).
Правило на будущее (ТЗ §9.2): в `.cshtml` не должно быть ни одного слова на иврите или русском, только `@L[...]`.

**Как проверить.** Открыть /ru/catalogs, Ctrl+U (исходный код) и поискать «עמ׳», «יח׳», «קטלוג» — их нет (иврит остаётся только в переключателе языка «עב»). На /catalogs всё по-прежнему на иврите.

---

## 6. «Ваш заказ»: обложка при «без обложки» — `06-order-summary.diff`

**Проблема.** Выбрал «Отдельная обложка: Нет», а в сводке «… · обложка 250 г 4+4 ламинация · 50 шт.»: обложка осталась, слово «ламинация» без значения. Скриншот `uzer-s1-result-ru-phone.png`.

**Причина.** `Pages/Catalogs.cshtml:259` — сводка собрана из готовых кусочков, кусок «обложка … 4+4» есть **всегда**. `updateUIElements()` (`:528-553`) заполняет кусочки, но на «Отдельная обложка» не смотрит. Слово «ламинация» стоит отдельно от значения в `<span id="lamination_section">`: если скрипт не успел его спрятать или заполнить (первая отрисовка, возврат страницы из кэша), видно голое слово.

**Решение.** Одна функция строит всю строку заново при каждом изменении, слова берёт из `data-text-*`:

```cshtml
<span data-summary="" data-text-page="@L["page"]" data-text-cover="@L["cover"]" data-text-no-cover="@L["no_cover_short"]" data-text-lamination="@L["lamination"]" data-text-unit="@L["unit"]"></span>
```

```js
function updateSummary() {
    const summary = document.querySelector('[data-summary]');
    const text = summary.dataset;
    const checked = name => form.querySelector(`input[name='${name}']:checked`);
    const label = name => checked(name).nextElementSibling.textContent;

    const parts = [
        checked('Format').value,
        label('Binding'),
        (pagesInput.value || '—') + ' ' + text.textPage + ' · ' + label('InnerPaper')
    ];
    if (checked('HasCover').value == 'true') {
        const print = checked('CoverPrint').value == '44' ? '4+4' : '4+0';
        parts.push(text.textCover + ' ' + label('CoverPaper') + ' ' + print);
        if (checked('Lamination').value != 'None')
            parts.push(text.textLamination + ' ' + label('Lamination').toLowerCase());
    }
    else
        parts.push(text.textNoCover);
    parts.push((document.getElementById('calc-qty').value || '—') + ' ' + text.textUnit);
    summary.textContent = parts.join(' · ');
}
```

Старые `format_summary`, `binding_summary`, `lamination_section` и т. п. удалены.

**Как проверить.** «Нет» обложки → «A5 · Скоба · 8 стр. · 130 г · без отдельной обложки · 50 шт.». «Да» + матовая → «… · обложка 250 г 4+4 · ламинация матовая · 200 шт.». Ламинация «Нет» → слова «ламинация» нет. Пустое поле страниц → «— стр.».

---

## 7. Превью брошюры — голый текст — `07-preview.diff`

**Проблема.** Слева (на телефоне под формой) вместо рисунка брошюры строка текста. При смене A4/A5/A6, скобы/спирали ничего не меняется. Группы «Печать обложки» и «Ламинация» слиплись. Скриншоты `vis-live-he-1366.png`, `vis-live-ru-390.png` (сравнить с `vis-mock-*`).

**Причина.** HTML превью перенесли из макета (`Catalogs.cshtml:21-68`), а стили — нет: в `wwwroot/css/*.css` нет ни одного класса `cat-*` (в макете это `design/mockup/assets/css/pages.css`, строки 294-347). Без стилей `.cat-cover-opts` нет и `gap: 22px` между группами обложки. Кроме того, `data-fmt="A4" data-binding="staple"` вписаны жёстко (`:29`), и скрипт их не меняет.

**Решение.**
1. В конец `wwwroot/css/pages.css` скопирован блок «Catalogs & magazines» из макета (без изменений; все переменные `--c-cyan`, `--r-xl`, `--shadow-float` и т. д. в `tokens.css` уже есть — файлы токенов одинаковые).
2. Разметка: `data-fmt="@Model.Format" data-binding="@Model.Binding.ToString().ToLower()"`, у сцены превью `data-text-alt`, `data-text-page`, `data-text-cover`, `data-text-no-cover`.
3. В скрипте функция `updatePreview()` (вызывается из `updateUIElements()`):

```js
book.dataset.fmt = format;                                     // CSS меняет размер: A4 230×325, A5 172×243, A6 128×181
book.dataset.binding = checked('Binding').value.toLowerCase(); // "Staple" -> "staple": скобы или спираль
book.classList.toggle('cat-book--gloss', hasCover && checked('Lamination').value == 'Gloss'); // блик
preview.querySelector('[data-cover-sub]').textContent = format + ' · ' + (pages + (hasCover ? 4 : 0)) + ' ' + text.textPage;
preview.setAttribute('aria-label', text.textAlt + ': ' + format + ', ' + label('Binding') + ', ' + pagesText + ' ' + text.textPage);
document.querySelector('[data-chips]').replaceChildren(...chips.map(...)); // 4 «таблетки» под рисунком
```

Число на обложке = страницы блока + 4 страницы отдельной обложки (как в макете).

**Как проверить.** Десктоп 1366: слева серый блок с брошюрой (розово-жёлто-голубая полоса снизу, CMYK-квадратики). A4 → A5 → A6 — брошюра уменьшается (в тесте 230×325 → 172×243 → 128×181 px). Спираль — слева появляется пружина, скоба — две скобы. Глянцевая ламинация — белый блик. Под рисунком «таблетки» «A4 · Скоба · 12 стр. · 130 г · обложка 250 г». Между «Печать обложки» и «Ламинация обложки» ровный отступ. Телефон: брошюра под формой, высота сцены 300 px.

---

## 8. Формат цены — `08-price-format.diff`

**Проблема.** После первого пересчёта итог «1346.19₪» (без пробела), а «в т. ч. НДС» и «Цена за экземпляр» — просто «205.35» и «13.46», без ₪. В сообщении WhatsApp на русском «1346,19₪» (запятая, без пробела). ТЗ §4/§6: «1346.19 ₪», два знака, в иврите обёрнуто в LRM.

**Причина.**
- `Pages/Catalogs.cshtml:513-515`: `result.data.priceIncVatIls + '₪'`, а НДС и цена за штуку — голые числа. Числа из JSON без `toFixed(2)`: 13.5 покажется как «13.5».
- `:264-272`: при загрузке страницы вписаны **выдуманные** цены «1346.19 ₪ / 205.35 ₪ / 13.46 ₪» — они видны, пока не пришёл первый ответ.
- `Catalogs.cshtml.cs:112`: `{response.PriceIncVatIls}₪` — число печатается по культуре страницы (на /ru с запятой).
- Попутно: строка «Минимальный заказ 118 ₪ с НДС» (`:274`) никогда не показывалась, а ключа `order_minimum_hint` в resx не было.

**Решение.**

```js
//price as in tz §4/§6: two decimals, a space and ₪ ("1346.19 ₪", "13.50 ₪");
//on the Hebrew page it is wrapped in LRM marks so that the number and ₪ are not mirrored
const lrm = document.documentElement.dir == 'rtl' ? '‎' : '';
function money(value) {
    return lrm + Number(value).toFixed(2) + ' ₪' + lrm;
}
...
totalOutput.textContent = money(result.data.priceIncVatIls);
vatOutput.textContent = money(result.data.vatIls);
unitOutput.textContent = money(result.data.unitPriceIncVatIls);
minNote.hidden = !result.data.minApplied; //"minimum order 118 ₪ incl. VAT"
```

В разметке до первого ответа: «— ₪», «—», «—» (как в макете). При ошибке итог «— ₪», строка минимума прячется.

Сервер (сообщение WhatsApp):

```csharp
// было
sb.Append($"{L["msg_price"]}: {response.PriceIncVatIls}₪ {L["msg_with_vat"]}");
// стало
string lrm = CultureInfo.CurrentUICulture.TextInfo.IsRightToLeft ? "%E2%80%8E" : "";
string price = response.PriceIncVatIls?.ToString("0.00", CultureInfo.InvariantCulture) ?? "";
sb.Append($"{L["msg_price"]}: {lrm}{price} ₪{lrm} {L["msg_with_vat"]}");
```

(`%E2%80%8E` — это LRM, уже закодированный для URL, потому что остальное сообщение тоже кодируется вручную, как `%0a`.) Новый ключ `order_minimum_hint`: «Минимальный заказ 118 ₪ с НДС» / «מינימום הזמנה — 118 ₪ כולל מע״מ».

**Как проверить.** /ru/catalogs: «1346.19 ₪», «205.35 ₪», «13.46 ₪». Ввести A4, скоба, 80 г, без обложки, 8 стр., 6 шт. (тест T04) → «118.00 ₪ | 18.00 ₪ | 19.67 ₪» и строка «Минимальный заказ 118 ₪ с НДС». Ссылка WhatsApp на /ru: «Цена: 1346.19 ₪ с НДС» (точка, пробел). На иврите цена не «переворачивается».

---

## 9. Бумага 300 г при скобе должна выглядеть неактивной — `09-paper-300-disabled.diff`

**Проблема.** При скобе «300 г» нажать нельзя, но выглядит как обычная кнопка. Клиент жмёт и не понимает, почему не выбирается. В макете — серый пунктирный зачёркнутый чип.

**Причина.** `Pages/Catalogs.cshtml:435-440`: скрипт ставит `radio.disabled`, но сама «таблетка» — это `<label class="pill">`, а у неё стиля для запрещённого состояния нет. В макете для этого класс `.pill--disabled` (`design/mockup/assets/css/pages.css:295`), на сайт он не перенесён.

**Решение.**

```js
radio.disabled = !allowed;
radio.closest('label').classList.toggle('pill--disabled', !allowed); //grey, dashed and crossed out (pages.css)
```

```css
.pill--disabled { background: var(--c-surface); color: var(--c-border); border-style: dashed; text-decoration: line-through; cursor: not-allowed; }
```

**Как проверить.** Скоба → «300 г» серая, пунктир, зачёркнута, курсор «запрещено». Спираль → снова обычная и выбирается.

---

## Что проверено запуском (11.11.2026)

Копия кода aa9879e + `all.diff`, `dotnet build -c Release` → 0 предупреждений, 0 ошибок; `dotnet run -c Release --urls http://localhost:5131`; Playwright (Chromium), iPhone 13 и 1366×900, he и ru:
- «по запросу» (32 стр. × 200 шт.): кнопка «Запросить расчёт в WhatsApp», в ссылке 32 стр., 200 шт., «Прошу рассчитать цену» / «אבקש הצעת מחיר»; сразу после ввода кнопка спрятана до нового ответа;
- нижняя панель на каталогах «Итого … Заказать →» / «по запросу» / «Исправить параметры» (клик прокручивает к ошибке); на /stickers, /business-cards, главной (he и ru) панель прежняя, ошибок JS нет;
- ошибка 7 стр. сразу под полем, рамка красная; пусто / 5.5 → понятный текст;
- в исходнике /ru/catalogs иврита нет, кроме переключателя языка;
- сводка без обложки, превью A4/A5/A6 меняет размер, 300 г зачёркнута, цены «1346.19 ₪», T04 = 118.00 ₪ со строкой минимума.

## Что заметили, но в этот набор не вошло

Это не решения владельца, а мелкие технические вещи, их можно сделать следующим шагом:
- ТЗ §9.1: скрипт должен жить в `wwwroot/js/catalogs.js`, а не внутри `Catalogs.cshtml` (сейчас inline). Патчи специально не переносят его, чтобы diff было легко читать; перенос — отдельный коммит, тексты уже в `data-*`.
- Сообщение WhatsApp: в `msg_file_whatsapp` лишний `%0a` перед 📎 (пустая строка); в строке «Блок» нет «мелованная матовая» (ТЗ §6); «Обложка: Мелованная матовая» с большой буквы.
- Тексты ошибок «больше максимума / меньше минимума» без самого числа (36, 150…).
- `Catalogs.cshtml.cs:24` открывает ресурсы как `"Pages.catalogs"` (маленькая c), а файл называется `Catalogs` — сейчас работает, но на Linux такое расхождение регистра легко ломается.
- `Catalogs.cshtml:82` `<span class="@isRtl">` выводит `class="True"/"False"`.
- `MAX_QUANTITY = 1_000_000`, а в ТЗ §3.1 `MaxQuantity` = 100000.
