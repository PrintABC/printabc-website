using System.Globalization;

namespace PrintABC.Utils
{
    public static class Helpers
    {
        public enum ValidationStatus
        {
            Ready,
            ManualQuote,
            ValidationError
        }

        public enum OrderType
        {
            Stickers = 0,
        }

        public const string PHONE_NUMBER = "972508494172";
        public const string LANDLINE = "97298874680";
        // Общий адрес заказа в WhatsApp для всех страниц (решение владельца 13.11: wa.me).
        // К нему дописывают закодированный текст сообщения: WHATSAPP_URL + Uri.EscapeDataString(text)
        // на сервере или WHATSAPP_URL + encodeURIComponent(text) в JS.
        public const string WHATSAPP_URL = $"https://wa.me/{PHONE_NUMBER}?text=";

        public static string ToInvariantString(this IConvertible value)
        {
            return value.ToString(CultureInfo.InvariantCulture);
        }
        public static int CeilDiv(int a, int b) => (a + b - 1) / b;
    }
}
