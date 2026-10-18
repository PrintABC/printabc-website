using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using PrintABC.Data;
using PrintABC.Services;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using static PrintABC.Services.StickerCalculatorService;
using static PrintABC.Utils.Helpers;

namespace PrintABC.Pages
{
    public class StickersModel : PageModel
    {
        private readonly StickerCalculatorService stickerCalculatorService;

        public StickersModel(StickerCalculatorService _stickerCalculatorService)
        {
            stickerCalculatorService = _stickerCalculatorService;
        }
        public string[] ShapeHTML =
        {
            "<svg class=\"icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"12\" cy=\"12\" r=\"8\" /></svg>",
            "<svg class=\"icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"4\" y=\"6\" width=\"16\" height=\"12\" rx=\"1.5\" /></svg>",
            "<svg class=\"icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M6 8c2-4 7-4 8-1s5 1 5 5-4 7-8 6-9 1-9-4 2-3 4-6z\" /></svg>"
        };

        [BindProperty] public StickerMaterial Material { get; set; } = StickerMaterial.Paper;
        [BindProperty] public ShapeType Shape { get; set; } = ShapeType.Circle;
        [BindProperty, Range(typeof(decimal), "0.1", "100")] public decimal DiameterCm { get; set; } = 5.0m;
        [BindProperty, Range(typeof(decimal), "0.1", "100")] public decimal WidthCm { get; set; } = 5.0m;
        [BindProperty, Range(typeof(decimal), "0.1", "100")] public decimal HeightCm { get; set; } = 5.0m;
        [BindProperty, Range(1, 1_000_000)] public int Quantity { get; set; } = 250;
        [BindProperty] public CutMode CutMode { get; set; } = CutMode.Normal;

        public QuoteResponse? response;

        public void OnGet()
        {
            response = stickerCalculatorService.Calculate(BuildQuoteRequest());
        }

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
                    data = new QuoteResponse { Status = ValidationStatus.ValidationError, ErrorCode = code }
                });
            }

            var quoteRequest = BuildQuoteRequest();
            var result = stickerCalculatorService.Calculate(quoteRequest);
            return new JsonResult(new { success = result.Status != ValidationStatus.ValidationError, data = result });

        }

        private QuoteRequest BuildQuoteRequest()
        {
            return new QuoteRequest(
                Material,
                Shape,
                DiameterCm * 10,
                WidthCm * 10m,
                HeightCm * 10m,
                Quantity,
                CutMode
            );
        }
    }
}
