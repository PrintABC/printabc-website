using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Localization;

namespace PrintABC.Pages
{
    // ---------------------------------------------------------------------------------
    // Страница «Бухгалтерские книжки» (/pinkasim, /ru/pinkasim).
    //
    // Цена считается В БРАУЗЕРЕ, как у визиток (решение владельца 15.11, ТЗ v1.1).
    // Сервер только рисует таблицу цен: каждая кнопка получает data-price,
    // а wwwroot/js/pinkasim.js берёт цену выбранной кнопки и собирает итог и ссылку WhatsApp.
    //
    // Почему таблица описана здесь, а не вручную в .cshtml:
    //   - 18 кнопок рисуются одним циклом, в разметке нет 18 почти одинаковых строк;
    //   - чтобы поменять цену, достаточно поменять одно число ниже;
    //   - aria-label кнопок строится из ресурсов, поэтому на /ru он по-русски (замечание В3).
    // ---------------------------------------------------------------------------------
    public class PinkasimModel : PageModel
    {
        // Одна строка таблицы: количество книжек и цена за 3 и за 2 листа (с НДС, целые ₪).
        // «record» — короткая запись класса только для хранения данных.
        public record PriceRow(int Qty, int Price3, int Price2);

        // Один вид книжки: код (он же data-kind в разметке) и строки таблицы.
        public record PinkasKind(string Code, PriceRow[] Rows);

        // Цены из ТЗ §2. Цена за 2 листа = round(цена за 3 листа × 0,8).
        // Порядок строк = порядок в таблице на странице.
        public static readonly PinkasKind[] Kinds =
        {
            new("a5", new PriceRow[]
            {
                new(1, 90, 72),
                new(2, 145, 116),
                new(4, 240, 192),
                new(10, 380, 304),
                new(20, 520, 416),
            }),
            new("six", new PriceRow[]
            {
                new(1, 145, 116),
                new(2, 240, 192),
                new(5, 420, 336),
                new(10, 620, 496),
            }),
        };

        // Выбор по умолчанию (ТЗ §3): A5, 3 листа, 4 книжки.
        // JS всё равно перерисует выбор при загрузке, но так страница выглядит правильно
        // ещё до запуска скрипта (и без мигания).
        public const string DefaultKind = "a5";
        public const int DefaultCopies = 3;
        public const int DefaultQty = 4;

        public void OnGet()
        {
        }

        // «4 книжки», «1 книжка», «10 книжек» / «פנקס אחד», «4 פנקסים».
        // Тексты берём из resx (ключи books_one / books_few / books_many, в них {0} = число).
        // Вызывается из .cshtml: в aria-label кнопок и в data-books у строк таблицы,
        // чтобы JS не нужно было самому склонять слова.
        public static string BooksText(IHtmlLocalizer L, int n)
        {
            // Правила склонения русского языка:
            //   1, 21, 31 …       → «книжка»  (one)
            //   2–4, 22–24 …      → «книжки»  (few)
            //   0, 5–20, 25–30 …  → «книжек»  (many)
            // Для иврита в resx books_few и books_many одинаковые («{0} פנקסים»),
            // а books_one = «פנקס אחד» без числа — поэтому та же функция подходит и ему
            // (21 книжки в таблице не бывает, только 1, 2, 4, 5, 10, 20).
            int mod10 = n % 10, mod100 = n % 100;
            string key;
            if (mod10 == 1 && mod100 != 11) key = "books_one";
            else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) key = "books_few";
            else key = "books_many";

            // GetString(key, n) берёт строку из resx и подставляет n вместо {0}.
            // Важно: именно GetString, а не L[key, n].Value — у L[...] свойство Value
            // возвращает строку БЕЗ подстановки числа («{0} книжки»).
            // HTML-кодирование сделает Razor, когда выведет строку в атрибут.
            return L.GetString(key, n).Value;
        }
    }
}
