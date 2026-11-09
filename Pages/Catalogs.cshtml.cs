using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Localization;
using PrintABC.Data;
using PrintABC.Services;
using System.ComponentModel.DataAnnotations;
using System.Text;
using static PrintABC.Services.CatalogCalculatorService;
using static PrintABC.Utils.Helpers;

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

        const int MIN_INNER_PAGE_COUNT = 4, MAX_INNER_PAGE_COUNT = 36, MIN_QUANTITY = 6, MAX_QUANTITY = 1_000_000;

        [BindProperty] public CatalogSize Format { get; set; } = CatalogSize.A4;
        [BindProperty] public CatalogBinding Binding { get; set; } = CatalogBinding.Staple;
        [BindProperty, Range(MIN_INNER_PAGE_COUNT, MAX_INNER_PAGE_COUNT, ConvertValueInInvariantCulture = true, ParseLimitsInInvariantCulture = true)] public int InnerPageCount { get; set; } = 12;
        [BindProperty] public int InnerPaper { get; set; } = 130;
        [BindProperty] public bool HasCover { get; set; } = true;
        [BindProperty] public int CoverPaper { get; set; } = 250;
        [BindProperty] public string CoverPrint { get; set; } = "44";
        [BindProperty] public LaminationType Lamination { get; set; } = LaminationType.None;
        [BindProperty, Range(MIN_QUANTITY, MAX_QUANTITY, ConvertValueInInvariantCulture = true, ParseLimitsInInvariantCulture = true)] public int Quantity { get; set; } = 100;


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
                    "Quantity" => Quantity < MIN_QUANTITY ? "qty_min" : "generic",
                    "InnerPageCount" => InnerPageCount < MIN_INNER_PAGE_COUNT ? "pages_min" : "pages_max",
                    _ => "generic"
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
            sb.Append($"{L["msg_format"]}: {Format.ToString()}, {L[Binding.ToString().ToLower()]}");
            sb.Append(newline);
            sb.Append($"{L["msg_inner"]}: {InnerPageCount} {L["page"]}, {L["innerpaper_" + InnerPaper]}");
            sb.Append(newline);
            if (HasCover)
            {
                string coverprint = (CoverPrint == "44") ? "4%2B4" : "4%2B0";
                string lam = Lamination switch
                {
                    LaminationType.None => L["no_lamination"],
                    LaminationType.Gloss => $"{L["lamination"]} {L["lamination_gloss"].ToString().ToLower()}",
                    LaminationType.Matte => $"{L["lamination"]} {L["lamination_matte"].ToString().ToLower()}",
                    _ => L["no_lamination"]
                };
                sb.Append($"{L["msg_cover"]}: {L["cover_paper_hint"]} {L["cover_paper_" + CoverPaper]}, {L["print"]} {coverprint}, {lam}");
            }
            else
                sb.Append($"{L["msg_cover"]}: {L["msg_no_cover"]}");
            sb.Append(newline);
            sb.Append($"{L["msg_quantity"]}: {Quantity} {L["unit"]}");
            sb.Append(newline);
            sb.Append($"{L["msg_price"]}: {response.PriceIncVatIls}₪ {L["msg_with_vat"]}");
            sb.Append(newline);
            sb.Append(L["msg_file_whatsapp"]);
            WhatsappMessage = sb.ToString();

        }
    }
}
