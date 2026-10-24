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
        public const string WHATSAPP_URL = $"https://api.whatsapp.com/send/?phone={PHONE_NUMBER}&text=";

        public static string ToInvariantString(this IConvertible value)
        {
            return value.ToString(CultureInfo.InvariantCulture);
        }

    }
}
