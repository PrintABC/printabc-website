# Каталоги: что не работает на 08928ec (2026-11-13)

Проверено на тест-сайте /ru/catalogs и /catalogs. Шаг → что видно → где в коде. Скриншоты и подробности: [docs/reviews/2026-11-13b-catalogs-recheck.md](../../reviews/2026-11-13b-catalogs-recheck.md).

1. **Тираж 100001** → «Итого null₪», «0.00₪», кнопка заказа активна с `href="undefined"`. Сервер отдаёт `qty_max`, а блока для него нет, и JS уходит в ветку успеха (cshtml:561-578). Решение: ошибку определять по `status == "validation_error"`, код без своего блока → показывать `generic`; добавить блок и ключ `error_qty_max`.
   ```js
   const isError = result.data.status == "validation_error";
   const targetError = isError
       ? (form.querySelector(`[data-error="${result.data.errorCode}"]`) ?? form.querySelector('[data-error="generic"]'))
       : null;
   ...
   else if (isError) { toggleInvalidPrices(false); showError(targetError); setSend(false); ... }
   ```
2. **32 стр. (появится «Рассчитаем индивидуально»), потом 7 стр.** → ошибка видна рядом с «Рассчитаем индивидуально». В ветке ошибки первой строкой `toggleInvalidPrices(false)`.
3. **Без обложки** → строка «в т. ч. НДС» показывает 205.35 ₪ (правильно 172.76), после ошибки «—». Строку НДС удалить совсем (cshtml:316-319 и все `vatOutput`).
4. **Тираж 6** → виден сырой ключ `order_minimum_hint`. Добавить в resx: ru «Минимальный заказ 118 ₪ с НДС», he «מינימום הזמנה — 118 ₪ כולל מע״מ».
5. **Любой расчёт** → «1346₪», «13.46₪»; нужно с пробелом «1346 ₪», «13.46 ₪» (на иврите в LRM) — на экране (cshtml:575-576) и в WhatsApp (cs:120). Заглушки в разметке (:314-322) → «—».
6. **Обложка «Да», бумага обложки 999 или 150 (запрос к API)** → HTTP 500 (Svc:45-53). Обложка 130 г принимается, а должна давать `bad_cover`. Нужна проверка `bad_cover` до `GetPaperInfo`.
7. **Ссылка заказа** → api.whatsapp.com; нужна wa.me для всего сайта (Helpers.cs:21).
8. **Превью брошюры** на ПК пустое, одно слово «Каталог». Скрыть `.cat-preview` (cshtml:21) до отдельной задачи.
