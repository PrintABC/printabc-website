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

        public static string[] OrderCodes = new string[] { "ST" };
        public const string WHATSAPP_URL = "https://api.whatsapp.com/send/?phone=972508494172&text=";

        public static string ToInvariantString(this IConvertible value)
        {
            return value.ToString(CultureInfo.InvariantCulture);
        }
    }
}
