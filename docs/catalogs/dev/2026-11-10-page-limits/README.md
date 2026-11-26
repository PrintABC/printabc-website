# Пример: ограничения по страницам каталога (ТЗ §2)

Основа: ветка `feature/initial-site`, коммит `34f48ec`. Патч `page-limits.patch` в этой папке, применяется так:

```
git apply page-limits.patch
```

Изменено 5 файлов, примерно 120 строк. Сборка `dotnet build -c Release` проходит без предупреждений и ошибок.

## 1. Что было не так

| Место | Что было | Что по ТЗ |
|---|---|---|
| `Pages/Catalogs.cshtml.cs:31` | `Range(4, 36)` у `InnerPageCount` для любого переплёта | у спирали до 200 стр., у скобы 170/250 г до 8 стр. |
| `Services/CatalogCalculatorService.cs:51` | `Pages % 4` для любого переплёта | у спирали шаг 2 (спираль 22 стр. отклонялась) |
| там же | `StapleMaxPages` и `SpiralMaxPages` в `PaperInfo` есть, но нигде не проверяются | максимум зависит от бумаги |
| там же | минимум не зависит от обложки | у скобы без обложки минимум 8 |
| `GetPaperInfo` | бумага не из списка (например 150) бросает исключение, то есть HTTP 500 | ошибка `bad_paper` |
| там же | скоба с блоком 300 г считается | `bad_paper` |
| `Pages/Catalogs.cshtml:114` | у поля жёстко `min=4 max=36 step=4 value=12`, подсказка `?` | поле меняет шаг, min и max при смене переплёта, бумаги и обложки |

## 2. Что поменялось

### `Services/CatalogCalculatorService.cs`

Все пределы теперь в сервисе, рядом с таблицей бумаги. Максимум берётся из уже существующих `PaperInfo.StapleMaxPages` и `SpiralMaxPages` (0 значит «нельзя»).

```csharp
const int StaplePageStep = 4, SpiralPageStep = 2;
const int StapleMinPagesNoCover = 8, StapleMinPagesWithCover = 4, SpiralMinPages = 20;

public record PageLimits(int Step, int Min, int Max);
public static PageLimits? GetPageLimits(CatalogBinding binding, int innerPaper, bool hasCover)
{
    if (!GetInnerPaperSizes().Contains(innerPaper))
        return null;
    PaperInfo paper = GetPaperInfo(innerPaper);
    PageLimits limits = binding switch
    {
        CatalogBinding.Staple => new(StaplePageStep, hasCover ? StapleMinPagesWithCover : StapleMinPagesNoCover, paper.StapleMaxPages),
        CatalogBinding.Spiral => new(SpiralPageStep, SpiralMinPages, paper.SpiralMaxPages),
        _ => throw new ArgumentOutOfRangeException(nameof(binding), binding, null)
    };
    return limits.Max == 0 ? null : limits;
}

//order of checks as in TZ §5: bad_paper -> pages_step -> pages_min -> pages_max
public static string? ValidatePages(CatalogQuoteRequest req) { ... }
```

`Calculate` в начале вызывает `ValidatePages` вместо `Pages % 4`. `GetPageLimitsTable()` отдаёт все сочетания для скрипта страницы, поэтому браузер и сервер берут одни и те же числа.

### `Pages/Catalogs.cshtml.cs`

Из `InnerPageCount` убран `Range(4, 36)`, константы `MIN/MAX_INNER_PAGE_COUNT` и ветка `"InnerPageCount"` в `switch`. Пределы зависят от переплёта, бумаги и обложки, поэтому их проверяет сервис.

### `Pages/Catalogs.cshtml`

- `min`, `max`, `step` и `value` поля страниц берутся из `GetPageLimits(...)`, а не жёстко из разметки.
- В подсказке `pages-hint` теперь «Шаг 4 стр., от 4 до 36 стр.» вместо «?». Шаблон лежит в `data-template`, его берёт JS.
- Добавлен блок ошибки `data-error="bad_paper"` по образцу `pages_step`.
- Скрипт: `const pageLimitsTable = @Json.Serialize(GetPageLimitsTable());` и функция `updatePageLimits()`. Она:
  - блокирует 300 г при скобе, а если 300 г была выбрана, выбирает 250 г;
  - ставит полю `min`, `max`, `step` и текст подсказки;
  - сдвигает значение к ближайшему допустимому (вниз к max, вверх к min, к кратному шагу).
- `updatePageLimits()` вызывается на `change` переплёта, бумаги и обложки, а не на `input` поля страниц. Иначе, пока клиент набирает «16», значение «1» сразу прыгало бы на минимум.

### `Resources/Pages/Catalogs.he.resx` и `.ru.resx`

Новые ключи `pages_hint` (`{0}` шаг, `{1}` минимум, `{2}` максимум) и `error_bad_paper`.

Подвох: `@L["pages_hint"]` без аргументов в атрибуте падает с `FormatException` (ViewLocalizer пытается подставить `{0}`). Поэтому для `data-template` используется `@L.GetString("pages_hint")`.

## 3. Проверка (локальный запуск, `/ru/catalogs`)

| Тест | Ввод | Ожидалось | Получено |
|---|---|---|---|
| T01–T08 | из §10 ТЗ | 118,77 · 1346,19 · 1679,14 · 118 · 348,11 · 1289,80 · 1829,61 · 1567,13 | совпадает ✅ |
| V01 | скоба, 10 стр. | `pages_step` | ✅ |
| V02 | скоба, 4 стр., без обложки | `pages_min` | ✅ |
| V03 | скоба, 40 стр., 130 г | `pages_max` | ✅ |
| V04 | скоба, 12 стр., 170 г | `pages_max` | ✅ |
| V05 | скоба, блок 300 г (с обложкой и без) | `bad_paper` | ✅ |
| V06 | спираль, 18 стр. | `pages_min` | ✅ |
| V07 | спираль, 21 стр. | `pages_step` | ✅ |
| V11 | бумага блока 150 | `bad_paper` (было HTTP 500) | ✅ |
| V15 | спираль, 300 г, 62 стр. | `pages_max` | ✅ |
| — | спираль, 22 стр. | расчёт проходит | ✅ |
| — | скоба 170 г, 8 стр., с обложкой и без | расчёт проходит | ✅ |

Поле страниц в браузере (Chromium):

| Действие | Поле | Подсказка |
|---|---|---|
| открыли страницу (скоба, 130 г, обложка) | 12, min 4, max 36, step 4; 300 г заблокирована | «Шаг 4 стр., от 4 до 36 стр.» |
| выбрали спираль | 20 (было 12), min 20, max 150, step 2; 300 г доступна | «Шаг 2 стр., от 20 до 150 стр.» |
| спираль, 300 г, ввели 61, выбрали скобу | бумага стала 250 г, страницы 8, max 8 | «Шаг 4 стр., от 4 до 8 стр.» |
| убрали обложку | 8, min 8, max 8 | «Шаг 4 стр., от 8 до 8 стр.» |
| иврит `/catalogs` | то же | «בקפיצות של 4 עמ׳, מ־4 עד 36 עמ׳» |

## 4. Чего пример не делает и что решить

- **Порядок проверок §5.** `Range` у `Quantity` в `CatalogsModel` срабатывает раньше сервиса. Поэтому при плохом тираже и плохих страницах сразу клиент получит `qty_min`, хотя по ТЗ первым должен прийти `pages_*`. Цену это не меняет. Исправить можно так же: перенести проверку тиража в сервис.
- **HTTP 400.** По ТЗ ошибка ввода отдаётся с кодом 400, а сейчас со статусом 200 и `success: false`. Здесь это не менял, потому что скрипт страницы читает ответ только при `response.ok`.
- Пределы в константах сервиса, как остальные числа программиста. По ТЗ §9 их нужно вынести в настройки; это отдельная задача для всего калькулятора.
- **Открытые вопросы §11 п. 6–7** (взяты значения по умолчанию): у спирали шаг 2, скоба с блоком 300 г запрещена, спираль без обложки допускается. Если решение поменяется, правится одна строка в `GetPageLimits` или в `GetPaperInfo`.
