using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Localization;
using PrintABC.Data;
using PrintABC.Services;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text;
using static PrintABC.Services.StickerCalculatorService;
using static PrintABC.Utils.Helpers;

namespace PrintABC.Pages
{
    public class StickersModel : PageModel, IWhatsappSendable
    {
        private readonly StickerCalculatorService stickerCalculatorService;
        private readonly IStringLocalizer L;

        public StickersModel(IStringLocalizerFactory factory, StickerCalculatorService _stickerCalculatorService)
        {
            stickerCalculatorService = _stickerCalculatorService;
            //matches the stickers page resources
            L = factory.Create("Pages.stickers", this.GetType().Assembly.GetName().Name!);
        }
        public string[] ShapeHTML =
        {
            "<svg class=\"icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"12\" cy=\"12\" r=\"8\" /></svg>",
            "<svg class=\"icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"4\" y=\"6\" width=\"16\" height=\"12\" rx=\"1.5\" /></svg>",
            "<svg class=\"icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M6 8c2-4 7-4 8-1s5 1 5 5-4 7-8 6-9 1-9-4 2-3 4-6z\" /></svg>"
        };

        [BindProperty] public StickerMaterial Material { get; set; } = StickerMaterial.Paper;
        [BindProperty] public ShapeType Shape { get; set; } = ShapeType.Circle;
        [BindProperty, Range(typeof(decimal), "0.1", "100", ConvertValueInInvariantCulture = true, ParseLimitsInInvariantCulture = true)] public decimal DiameterCm { get; set; } = 5.0m;
        [BindProperty, Range(typeof(decimal), "0.1", "100", ConvertValueInInvariantCulture = true, ParseLimitsInInvariantCulture = true)] public decimal WidthCm { get; set; } = 5.0m;
        [BindProperty, Range(typeof(decimal), "0.1", "100", ConvertValueInInvariantCulture = true, ParseLimitsInInvariantCulture = true)] public decimal HeightCm { get; set; } = 5.0m;
        [BindProperty, Range(1, 1_000_000, ConvertValueInInvariantCulture = true, ParseLimitsInInvariantCulture = true)] public int Quantity { get; set; } = 250;
        [BindProperty] public CutMode CutMode { get; set; } = CutMode.Normal;

        public StickerQuoteResponse? response;

        public string WhatsappMessage { get; set; } = "";

        //public void OnGet()
        //{
        //    response = stickerCalculatorService.Calculate(BuildQuoteRequest());
        //    CreateMessage();
        //}

        public IActionResult OnPostCalculate()
        {
            if (!ModelState.IsValid)
            {
                var key = ModelState.Where(kv => kv.Value!.Errors.Count > 0)
                    .Select(kv => kv.Key).FirstOrDefault() ?? "";
                var code = key switch
                {
                    nameof(Quantity) => "qty",
                    nameof(DiameterCm) or nameof(WidthCm) or nameof(HeightCm) => "size",
                    _ => "input"
                };
                return new JsonResult(new
                {
                    success = false,
                    data = new StickerQuoteResponse { Status = ValidationStatus.ValidationError, ErrorCode = code }
                });
            }

            var quoteRequest = BuildQuoteRequest();
            response = stickerCalculatorService.Calculate(quoteRequest);
            CreateMessage();
            return new JsonResult(new { success = response.Status != ValidationStatus.ValidationError, data = response, wpmessage = WHATSAPP_URL + WhatsappMessage });

        }

        private StickerQuoteRequest BuildQuoteRequest()
        {
            return new StickerQuoteRequest(
                Material,
                Shape,
                DiameterMm: Math.Round(DiameterCm, 1) * 10,
                WidthMm: Math.Round(WidthCm, 1) * 10m,
                HeightMm: Math.Round(HeightCm, 1) * 10m,
                Quantity,
                CutMode
            );
        }
        public void CreateMessage()
        {
            string size = Shape == ShapeType.Circle ? $"{L["size_diameter"]} {DiameterCm}" : $"{WidthCm}x{HeightCm}";

            var sb = new StringBuilder();
            string newline = "%0a";
            sb.Append(L["msg_hello"]);
            sb.Append(newline);
            sb.Append(string.Format(L["msg_material"], L[Material.ToString().ToLower()]));
            sb.Append(newline);
            sb.Append(string.Format(L["msg_shape"], L[$"shape_{Shape.ToString().ToLower()}"], size));
            sb.Append(newline);
            sb.Append(string.Format(L["msg_qty"], Quantity));
            sb.Append(newline);
            sb.Append(string.Format(L["msg_cut"], L[$"cutting_{CutMode.ToString().ToLower()}"]));
            sb.Append(newline);
            sb.Append(string.Format(L["msg_price"], response!.PriceIncVatIls));
            sb.Append(newline);
            sb.Append(L["msg_file_whatsapp"]);
            WhatsappMessage = sb.ToString();
        }
    }
}
