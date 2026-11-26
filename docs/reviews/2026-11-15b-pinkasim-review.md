# Ревью «Бухгалтерские книжки» (/pinkasim), 2026-11-15, второй проход

Продукт: сайт PrintABC, страница «Бухгалтерские книжки» / «פנקסים».
Диапазон: **a17503a..d1f8bc0** (5 коммитов: 0e89a57, e145933, 21bf847, 43ca797, d1f8bc0; 5 файлов, +70/−21).
**Следующее ревью от: d1f8bc0.**
Агенты: 4×Sonnet (git/сборка; цены; WhatsApp/тексты/доступность; вид/телефон) + судья Opus.
Эталоны: ТЗ v1.2, `decisions.md` (15.11), макет, CLAUDE.md (`chore/project-rules`).
Тест-сайт = d1f8bc0 [проверено]. Скриншоты: `2026-11-15b-pinkasim-img/`.
Не ошибки (решения 15.11): цена в браузере, inline JS, `api.whatsapp.com`, пустой PageModel.

**Открыто: Б — 3 (Б2, Б5, Б6), В — 7 (В1, В3, В4, В6, В7, В8, В9) + В2 частично, М — 4 (М1, М2, М3, М5).**

## 1. Коротко

- Готовность примерно **70 %** [оценка] (было 60 %). Б4 закрыт (стили `pk-*`, телефон), футер ведёт на страницу, склонение верное. Сборка 0/0, 18 цен верные, консоль чистая.
- **Новый блокер Б6:** на /ru в «Ваш заказ» видно `{kind} · 3 листа · 4 книжки по 50 комплектов`. Чинится одной строкой.
- Сводка: на /ru для «шестёрок»×1 строка пустая (В8). На иврите вместо утверждённого «אי5 / אי4» стоит «A5 / (6 בדף A4)» (В9).
- WhatsApp (Б2): ссылка открывается, но текст не по ТЗ §5.
- Не начаты: нижняя панель (Б5), «Назад» (В1), aria-label на /ru (В3), пункт меню ☰ (В4), hreflang (В7).

## 2. Статус старых замечаний

| ID | Статус | Что сейчас (d1f8bc0) |
|---|---|---|
| Б1, Б3 | снято 15.11 | цена в браузере |
| Б2 WhatsApp | ⚠️ частично | `%0📎` → `%0a📎` (e145933), ссылка декодируется. Остальное не сделано, см. §3 |
| Б4 стили `pk-*` | ✅ исправлено | `pages.css:325-334` = макет 350-358. Хвосты: М5 (767px) и обрезка таблицы на 390 (М1) |
| Б5 нижняя панель | ❌ нет | `_BottomBar.cshtml:2` → `/stickers`, `base.css:15` 16 px |
| В1 «Назад» | ❌ нет | нет `sessionStorage`/`pageshow` [проверено агентом 2] |
| В2 склонение в сводке | ⚠️ частично | склонение верное, но появились Б6, В8, В9 |
| В3 aria-label на /ru | ❌ нет | `Pinkasim.cshtml:50-103`: «פנקס אחד · 3 листа · 90 ₪» |
| В4 футер/меню | ⚠️ частично | футер ✅ (`_Footer.cshtml:16`), меню ☰ ❌ (`_Header.cshtml:56`) |
| В5 inline-скрипт | снято 15.11 | — |
| В6 ошибка / выбор не найден | ❌ нет | по ТЗ v1.2 §4 нужен откат к A5·3·4, а `getSelection()` (`:254-256`) берёт первую ячейку (90 ₪) |
| В7 hreflang | ❌ нет | `_Layout.cshtml:11-23`, на live 0 `link[rel=alternate]` |
| М1 заголовок столбца | ❌ нет | `:42,79` |
| М2 имена ключей, «A5» в разметке | ❌ нет | `:27,36,39` |
| М3 width/height фото | ❌ нет | `:21` |
| М4 wa.me | снято 15.11 | `api.whatsapp.com` разрешён |

## 3. Цены и WhatsApp

Цены [проверено агентом 2]: 18 `data-price` = ТЗ §2, итог и WhatsApp совпадают, T01–T10 ✅, смена вида по §3, по умолчанию 240 ₪.

Текст WhatsApp (he и ru, раскодирован агентом 3, сверено с resx), отличия от §5: нет строки «מספר התחלתי: » / «Начальный номер: »; лишний перенос перед 📎; конец обрезан (нет «אם אין קובץ, אשלח לוגו ופרטי העסק.» / «Если макета нет, пришлю логотип и реквизиты.»), в he лишнее « .»; нет LRM вокруг цены; `whatsapp_template` с `%0a`, `:293` без `encodeURIComponent` (сломается на `&`, `#`, `+`, `%` в тексте).

## 4. Проблемы и как исправить

### Б — блокеры

**Б6 (новое). /ru: в «Ваш заказ» буквально `{kind}`.** [проверено: код + live]
- Что не так: `Pinkasim.ru.resx:200,287` содержат `{kind}`, а `updateSummary` (`Pinkasim.cshtml:272-280`) его не заменяет; `sumKind` (`:193`) не используется.
- Почему важно: ТЗ §3. Агенты разошлись (Б/В). Решение — **Б**: в отличие от прошлого В2 (падеж), шаблонный мусор виден каждому русскому покупателю в главном блоке, страница выглядит сломанной.
- Как исправить (вместе с В8 и В9):
```js
function updateSummary(sel) {
    const lines = summaryLines[sel.kind];
    const t = lines[pluralRules.select(sel.qty)];
    // пустое значение в resx = «особого варианта нет», берём общий шаблон
    const template = (t && t.value) ? t.value : lines.other.value;
    sumText.textContent = template
        .replace("{kind}", sumKind[sel.kind].value)   // A5 / Шестёрки / אי5 / אי4
        .replace("{n}", sel.qty)
        .replace("{qty}", getQtyText(sel.qty))
        .replace("{copies}", sumCopies[sel.copies].value);
}
```

**Б2 (старое). Текст WhatsApp не по ТЗ §5.** [проверено]
- Как исправить: в resx `whatsapp_template` без `%0a` (обычные переносы), добавить «Начальный номер: » и полный конец, в he убрать « .», `{price} ₪` → `{price}`. В `updateWhatsappLink`:
```js
const isRtl = document.documentElement.dir === "rtl";
const priceText = sel.price + " ₪";
const data = {
    kind: kindTexts[sel.kind].value,
    copies: copiesTexts[sel.copies].value,
    qty: getQtyText(sel.qty),
    price: isRtl ? "\u200E" + priceText + "\u200E" : priceText,
};
// ... цикл replaceAll как сейчас ...
template = template.replace(/\r\n/g, "\n");   // переносы из resx одного вида
whatsappButton.href = whatsappUrl + encodeURIComponent(template);
```
Проверка: `new URL(href).searchParams.get("text")` = блоки ТЗ §5.

**Б5 (старое). Нижняя панель от наклеек.** [проверено]
- Как исправить: `ViewData["BottomBar"] = "pinkasim"`; в `_BottomBar.cshtml` при `Model as string == "pinkasim"` вывести итог `id="pk-bar-total"` и кнопку `id="pk-bar-next"` (разметка из макета), иначе как сейчас. В `updateDisplayPrice()`: `if (barTotal) { barTotal.textContent = totalPrice.textContent; barNext.href = whatsappButton.href; }`. Токен высоты панели в `tokens.css`, в `base.css` (≤ 767.98px) `scroll-padding-bottom: calc(var(--bottom-bar-h) + 16px)`.

### В — важно

**В8 (новое). /ru, «шестёрки»×1: сводка пустая.** [проверено: live, six·1·3 и six·1·2] `Pinkasim.ru.resx:290` `summary_line_sixes_one` = `<value />`. Значение найдено (пустое), поэтому `!t.isResourceNotFound` пропускает его (`:275`). Решение — **В** (агенты 3, 4 ставили Б): 1 из 8 комбинаций, мусора нет, итог и WhatsApp верные. Исправить: проверка `t && t.value` (код в Б6) и в ru записать в ключ общий шаблон `{kind} · {copies} · {qty} по 50 комплектов`.

**В9 (новое). Иврит: сводка не по решению владельца 15.11.** [проверено: live] Сейчас «4 פנקסים בגודל A5, …» и «2 שישיות פנקסים בגודל (6 בדף A4), …» (`he.resx:200,287`). Исправить в `Pinkasim.he.resx` (с кодом из Б6):
- `summary_line_a5` = `{qty} בגודל {kind}, {copies}, 50 סטים בפנקס`, `sum_kind_a5` = `אי5`;
- `summary_line_sixes` = `{n} שישיות פנקסים בגודל {kind}, {copies}, 50 סטים בפנקס`, `sum_kind_six` = `אי4`.
Вариант для 1 книжки «шестёрок» (`summary_line_sixes_one`) владелец не утверждал — не ошибка, см. §7.

**В1 + В6. «Назад» и выбор по умолчанию.** [проверено] Добавить в скрипт:
```js
const STORE_KEY = "pinkasim-choice";
function saveChoice(sel) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ kind: sel.kind, copies: sel.copies, qty: sel.qty })); } catch (e) { }
}
// ищем сохранённую ячейку среди кнопок страницы
function findSavedButton() {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) { }
    if (!s) return null;
    return Array.from(priceButtons).find(b =>
        b.closest(".pk-table").dataset.kind === s.kind &&
        b.dataset.copies === String(s.copies) &&
        b.closest("tr").dataset.qty === String(s.qty)) || null;
}
function defaultButton() {   // ТЗ §4: A5, 3 листа, 4 книжки
    return getTable("a5").querySelector('tr[data-qty="4"] .price-btn[data-copies="3"]');
}
function applyButton(btn) {
    const kind = btn.closest(".pk-table").dataset.kind;
    const radio = document.querySelector(`#pk-calc input[name="kind"][value="${kind}"]`);
    radio.checked = true;
    tables.forEach(t => t.hidden = t.dataset.kind !== kind);
    activeTable = getTable(kind);
    selectButton(btn);
    kindName.textContent = radio.closest("label").querySelector("strong").textContent;
    updateDisplayPrice();
}
```
В конце `updateDisplayPrice()`: `saveChoice(sel)`. В `getSelection()`: `if (!btn) { applyButton(defaultButton()); btn = getSelectedButton(activeTable); }`. Вместо `switchKind(getCheckedKind())` в конце: `applyButton(findSavedButton() || defaultButton());` и `window.addEventListener("pageshow", () => applyButton(findSavedButton() || defaultButton()));`. Проверить: «шестёрки»·5·2 → главная → «Назад» → 336 ₪.

**В3. Иврит в aria-label на /ru.** [проверено] Проще задать aria-label из скрипта (склонение есть в `getQtyText`):
```js
priceButtons.forEach(b => {
    const qty = Number(b.closest("tr").dataset.qty);
    // «4 книжки · 3 листа · 240 ₪» / «4 פנקסים · 3 עותקים · 240 ₪»
    b.setAttribute("aria-label", `${getQtyText(qty)} · ${b.dataset.copies} ${copiesWord} · ${b.dataset.price} ₪`);
});
```
(`const copiesWord = @Json.Serialize(L["copies"].Value);`, атрибуты `aria-label` в `:50-103` удалить.)

**В4. Пункт меню ☰.** [проверено] `_Header.cshtml` после `:56`: `<a href="/pinkasim">@L["pinkasim"]</a>`, ключ `pinkasim` в `_Header.he.resx` («פנקסים») и `_Header.ru.resx` («Бухгалтерские книжки»).

**В7. hreflang + canonical в `_Layout`** (15.11, для всех страниц). [проверено] Путь без `/ru` (как `targetUrl` в `_Header.cshtml:23-36`) → `alternate` he, ru, `x-default` (→ he) с полным адресом и `canonical`.

### М — мелочи

**М1. Заголовок первого столбца** (`:42,79`). [проверено] Добавить `col_qty` («Книжек» / «פנקסים»). На 390 px длинное «Бухгалтерские книжки» расширяет первый столбец, и столбец «2 листа» обрезан справа (`cmp-table-ru-390.png`), в макете влезает [причина — предположение].
**М2. «A5» в разметке** (`:27,36,39`). [проверено] Брать из resx (`wa_kind_a5`).
**М3. `width`/`height` у `.pk-hero`** (`:21`). [проверено] Указать размеры файла `receipt-books.jpg`, `loading="lazy"` не ставить.
**М5 (новое). `pages.css:334` `max-width: 767px`** — так в макете, но CLAUDE.md §1.6 требует `767.98px`. [проверено]

## 5. Порядок исправлений

1. Б6 + В8 + В9: `updateSummary` (код выше) и resx he/ru.
2. Б2: шаблон WhatsApp по §5, `encodeURIComponent`, LRM.
3. Б5: `_BottomBar` с итогом и ссылкой, `scroll-padding-bottom`.
4. В1 + В6: `sessionStorage`, `pageshow`, выбор по умолчанию A5·3·4.
5. В3 + М1 + М2: aria-label из скрипта, `col_qty`, «A5» из resx; проверить таблицу на 390.
6. В4: пункт меню ☰.
7. В7 + М3 + М5: hreflang/canonical в `_Layout`, размеры фото, `767.98px`.
8. Скриншоты he/ru × 390/1440 в PR.

После шагов 1–3 — около 85 %, после всех шагов — готово к приёмке [оценка].

## 6. Как проверяли

Код d1f8bc0 и diff (посторонних правок нет), resx как XML, сборка 0/0, Playwright локально и на тест-сайте. Судья перепроверил код всех находок и на live — сводку ru/he и `link[rel=alternate]`.

## 7. Вопросы владельцу

1. **«Шестёрки», 1 книжка, иврит.** Разработчик сделал «פנקס שישיות אחד בגודל (6 בדף A4), …», после В9 станет «פנקס שישיות אחד בגודל אי4, …». Утвердить или дать свой?
2. **ru, «шестёрки».** В ТЗ §3 пример только для A5. После Б6: «Шестёрки · 3 листа · 2 книжки по 50 комплектов». Подходит?

## 8. Отброшенные и исправленные находки агентов

- Агент 1: «CLAUDE.md нет» — он в `chore/project-rules`. М6 `border-radius: 14px` — из макета, радиус CLAUDE.md не запрещает.
- Агент 3: `Name1`, `Bitmap1`… — пример в комментарии ResX, не ключи.
- Тяжесть: `{kind}` на /ru (агент 2: В) → **Б6**; пустая строка шестёрки×1 (агенты 3, 4: Б) → **В8**. «Иврит в aria-label» (агент 2) = В3.
