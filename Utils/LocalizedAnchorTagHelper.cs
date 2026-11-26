using Microsoft.AspNetCore.Razor.TagHelpers;
using System.Globalization;

namespace PrintABC.Utils
{
    [HtmlTargetElement("a", Attributes = "href")]
    public class LocalizedAnchorTagHelper : TagHelper
    {
        public override int Order => -1000; //run early before other tag helpers

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var href = output.Attributes["href"]?.Value?.ToString();

            //skip exceptions
            if (output.Attributes.ContainsName("data-no-localize") || output.Attributes.ContainsName("hreflang"))
            {
                return;
            }

            //only process internal relative links (ignore external http://, tel:, mailto:, javascript:, or anchors #)
            if (string.IsNullOrEmpty(href) || href.StartsWith("http") || href.StartsWith("#") || href.StartsWith("mailto:") || href.StartsWith("tel:"))
            {
                return;
            }

            var isRu = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.Equals("ru", StringComparison.OrdinalIgnoreCase);

            if (isRu)
            {
                if (!href.StartsWith("/"))
                {
                    href = "/" + href;
                }

                //avoid double prefixing if the link already starts with /ru
                if (!href.StartsWith("/ru", StringComparison.OrdinalIgnoreCase))
                {
                    if (href == "/")
                    {
                        href = "/ru";
                    }
                    else
                    {
                        href = "/ru" + href;
                    }
                }
            }
            else
            {
                //for hebrew, check if /ru isn't accidentally present
                if (href.StartsWith("/ru/", StringComparison.OrdinalIgnoreCase))
                {
                    href = href.Substring(3);
                }
                else if (href.Equals("/ru", StringComparison.OrdinalIgnoreCase))
                {
                    href = "/";
                }
            }

            output.Attributes.SetAttribute("href", href);
        }
    }
}
