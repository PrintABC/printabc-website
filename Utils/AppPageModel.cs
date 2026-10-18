using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Globalization;

namespace PrintABC.Utils
{
    //for future use when page models exist
    public abstract class AppPageModel : PageModel
    {
        /// <summary>
        /// Returns "/ru" when active culture is Russian, or "" when Hebrew.
        /// </summary>
        public string UrlPrefix => CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.Equals("ru", StringComparison.OrdinalIgnoreCase)
            ? "/ru"
            : string.Empty;

        /// <summary>
        /// Formats an internal path with the current culture prefix.
        /// Example: LocalUrl("/cards") -> "/ru/cards" or "/cards"
        /// </summary>
        public string LocalUrl(string path)
        {
            if (string.IsNullOrEmpty(path)) return UrlPrefix == "" ? "/" : UrlPrefix;

            if (!path.StartsWith("/")) path = "/" + path;

            return $"{UrlPrefix}{path}";
        }
    }
}