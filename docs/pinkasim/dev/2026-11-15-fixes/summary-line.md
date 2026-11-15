# Строка «Ваш заказ»: склонение и порядок слов (he/ru)

Решение под текущий код разработчика (`Pages/Pinkasim.cshtml` с inline-скриптом). Утверждено владельцем 15.11.

**Проблема.** Сейчас выводится `число + "Книжек, 50 комплектов в книжке"` → «4 Книжек», «1 פנקסים».
Кроме того, в иврите другой порядок слов, поэтому собирать строку кусками в коде нельзя.

**Решение.** Строка целиком — шаблон в resx, скрипт только подставляет значения.

## 1. resx: удалить `set_50`, добавить ключи

| ключ | ru | he |
|---|---|---|
| `summary_line` | `{kind} · {copies} · {qty} по 50 комплектов` | `{qty} בגודל {kind}, {copies}, 50 סטים בפנקס` |
| `sum_kind_a5` | `A5` | `אי5` |
| `sum_kind_six` | `Шестёрки` | `שישיות (6 בדף A4)` |
| `sum_copies_3` | `3 листа` | `מקור + 2 עותקים` |
| `sum_copies_2` | `2 листа` | `מקור + עותק` |

`{qty}` — количество книжек уже склонённое. Его даёт существующая функция `getQtyText(n)` из ключей `wa_qty_*`:
- ru: 1 книжка; 2, 4 книжки; 5, 10, 20 книжек;
- he: 1 → `פנקס אחד` (без цифры), остальные → `{n} פנקסים`.
  `Intl.PluralRules('he')` для 2 вернёт `two`, ключа `wa_qty_two` нет — функция возьмёт `wa_qty_other`, это правильно.

## 2. Pinkasim.cshtml — разметка

Всё содержимое `<p class="cat-summary">` заменить на:

```html
<p class="cat-summary"><strong id="pk-sum-text"></strong></p>
```

## 3. Скрипт

Удалить старые переменные `sumKinds`, `sumCopies`, `sumQty` (querySelectorAll / getElementById) и добавить:

```js
// Шаблон строки «Ваш заказ» и её части из resx
const summaryLine = @Json.Serialize(L["summary_line"]);
const sumKind = { a5: @Json.Serialize(L["sum_kind_a5"]), six: @Json.Serialize(L["sum_kind_six"]) };
const sumCopies = { "3": @Json.Serialize(L["sum_copies_3"]), "2": @Json.Serialize(L["sum_copies_2"]) };
const sumText = document.getElementById("pk-sum-text");

function updateSummary(sel) {
    // Подставляем значения в шаблон; порядок слов задаёт шаблон, а не код
    sumText.textContent = summaryLine.value
        .replace("{qty}", getQtyText(sel.qty))          // «4 книжки» / «פנקס אחד»
        .replace("{kind}", sumKind[sel.kind].value)
        .replace("{copies}", sumCopies[sel.copies].value);
}
```

## Результат

- ru: `A5 · 3 листа · 4 книжки по 50 комплектов`, `Шестёрки · 2 листа · 10 книжек по 50 комплектов`
- he: `2 פנקסים בגודל אי5, מקור + 2 עותקים, 50 סטים בפנקס`, `פנקס אחד בגודל אי5, מקור + עותק, 50 סטים בפנקס`

В чате строка на иврите, начинающаяся с цифры, может показаться с цифрой в конце — это особенность отображения
кода слева направо. На странице (`dir="rtl"`) цифра стоит в начале.

Тот же результат (другим способом, без `getQtyText`) — в PR #10.
