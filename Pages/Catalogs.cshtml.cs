using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Localization;
using PrintABC.Data;
using PrintABC.Services;
using System.Text;
using static PrintABC.Utils.Helpers;
using static PrintABC.Services.CatalogCalculatorService;

namespace PrintABC.Pages
{

    public class CatalogsModel : PageModel, IWhatsappSendable
    {
        private readonly CatalogCalculatorService catalogCalculatorService;

        private readonly IStringLocalizer L;

        public CatalogsModel(IStringLocalizerFactory factory, CatalogCalculatorService _catalogCalculatorService)
        {
            catalogCalculatorService = _catalogCalculatorService;
            //matches the catalogs page resources
            L = factory.Create("Pages.catalogs", this.GetType().Assembly.GetName().Name!);
        }

        [BindProperty] public CatalogSize Format { get; set; } = CatalogSize.A4;
        [BindProperty] public CatalogBinding Binding { get; set; } = CatalogBinding.Staple;
        [BindProperty] public int InnerPageCount { get; set; } = 12;
        [BindProperty] public int InnerPaper { get; set; } = 130;
        [BindProperty] public bool HasCover { get; set; } = true;
        [BindProperty] public int CoverPaper { get; set; } = 250;
        [BindProperty] public string CoverPrint { get; set; } = "44";
        [BindProperty] public LaminationType Lamination { get; set; } = LaminationType.None;
        [BindProperty] public int Quantity { get; set; } = 100;


        public CatalogQuoteResponse? response;

        public string WhatsappMessage { get; set; } = "";
        public IActionResult OnPostCalculate()
        {
            if (!ModelState.IsValid)
            {
                var key = ModelState.Where(kv => kv.Value!.Errors.Count > 0)
                    .Select(kv => kv.Key).FirstOrDefault() ?? "";
                var code = key switch
                {

                    _ => "input"
                };
                return new JsonResult(new
                {
                    success = false,
                    data = new CatalogQuoteResponse { Status = ValidationStatus.ValidationError, ErrorCode = code }
                });
            }

            var quoteRequest = BuildQuoteRequest();
            response = catalogCalculatorService.Calculate(quoteRequest);
            CreateMessage();
            return new JsonResult(new { success = response.Status != ValidationStatus.ValidationError, data = response, wpmessage = WHATSAPP_URL + WhatsappMessage });

        }

        private CatalogQuoteRequest BuildQuoteRequest()
        {
            return new CatalogQuoteRequest(
                Format,
                Binding,
                InnerPageCount,
                InnerPaper,
                HasCover,
                CoverPaper,
                CoverPrint,
                Lamination,
                Quantity);
        }

        public void CreateMessage()
        {
            var sb = new StringBuilder();
            string newline = "%0a";
            sb.Append(L["msg_hello"]);
            sb.Append(newline);

            sb.Append(L["msg_file_whatsapp"]);
            WhatsappMessage = sb.ToString();

        }
    }
}
