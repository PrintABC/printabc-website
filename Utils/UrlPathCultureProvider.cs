using Microsoft.AspNetCore.Localization;

namespace PrintABC.Utils
{
    public class UrlPathCultureProvider : RequestCultureProvider
    {
        public override Task<ProviderCultureResult?> DetermineProviderCultureResult(HttpContext httpContext)
        {
            var routeValues = httpContext.GetRouteData().Values;
            var culture = routeValues["culture"]?.ToString();

            if (string.Equals(culture, "ru", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult<ProviderCultureResult?>(new ProviderCultureResult("ru"));
            }

            //default to hebrew otherwise
            return Task.FromResult<ProviderCultureResult?>(new ProviderCultureResult("he"));
        }
    }
}
