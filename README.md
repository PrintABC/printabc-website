# PrintABC — сайт типографии (printabc.co.il)

Новый сайт семейной типографии «דפוס איי.בי.סי / PrintABC» в Нетании.
Языки: иврит (основной, RTL) и русский. Наклейки с калькулятором цены, визитки с таблицей цен, заказ с загрузкой макета.

## Стек

- ASP.NET Core (.NET 10), **Razor Pages** — страницы собираются на сервере
- CSS и JS — из готового макета (`design/mockup`), без React, Node и npm
- Minimal API (`/api/price`, `/api/orders`), EF Core + PostgreSQL, MailKit
- Хостинг: Linux VPS, Nginx → Kestrel

## Где что лежит

| Путь | Что |
| --- | --- |
| `design/mockup/` | **Эталон дизайна.** Готовая вёрстка: 8 страниц (he + ru), 5 CSS, 4 JS, фото, иконки. Открыть: `cd design/mockup && python -m http.server` → http://localhost:8000 |
| `src/PrintABC.Web/` | Приложение (создаёт программист) |
| `tests/` | Юнит-тесты и e2e (Playwright) |
| `CLAUDE.md` | Правила проекта — для программиста и для AI-агентов, которые проверяют код |

Полная инструкция по переносу, план этапов и критерии приёмки — в документе
«PrintABC — перенос дизайна на ASP.NET Core (один стек C#)» (ссылку даёт владелец проекта).

## Как работаем

1. Ветка `main` защищена: изменения — только через Pull Request с одобрением владельца.
2. Одна задача = одна ветка = один Pull Request (`feature/header`, `feature/stickers-calculator`, …).
3. В описании Pull Request — что сделано, скриншоты он/ru на 390 и 1440 px, как проверить.
4. Секреты (пароли SMTP, строки подключения) — только в переменных окружения / GitHub Secrets, никогда в коде.

## Запуск (после того как появится код)

```bash
dotnet run --project src/PrintABC.Web
dotnet test
```
