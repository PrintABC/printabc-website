# Наклейки (`/stickers`)

- **ТЗ калькулятора:** Claude Doc «Калькулятор наклеек: ТЗ для разработчика v2» — https://claude.ai/artifact/KtLQXURD1wtJWxXnbM4KrB (живой документ, правки видны сразу; тесты T01–T11).
- **ТЗ заказа через WhatsApp (общий модуль):** [`../whatsapp-order/tz.md`](../whatsapp-order/tz.md), v2.2 — правила Р17 (цены с НДС, в т. ч. за штуку) и Р18 (целые ₪, строки НДС нет).
- **Контрольные примеры цены:** [`tests.json`](tests.json) — запуск: `python3 docs/tests/price_tests.py docs/stickers/tests.json`.
- **Последняя проверка:** [`../reviews/2026-10-24-stickers-progress.md`](../reviews/2026-10-24-stickers-progress.md), тесты цены — [`../reviews/2026-11-12-price-tests.md`](../reviews/2026-11-12-price-tests.md).
- **Текущее задание:** PR #5.
