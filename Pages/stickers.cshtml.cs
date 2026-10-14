using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using PrintABC.Data;
using PrintABC.Services;
using static PrintABC.Services.StickerCalculatorService;

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

        [BindProperty]
        public QuoteRequest quoteRequest { get; set; } = new(
            StickerMaterial.Paper,
            ShapeType.Circle,
            5m,
            5m,
            250,
            CutMode.Normal);

        public required QuoteResponse response;

        public void OnGet()
        {
            response = stickerCalculatorService.Calculate(quoteRequest);
        }

        public IActionResult OnPostCalculate()
        {
            try
            {
                var result = stickerCalculatorService.Calculate(quoteRequest);
                return new JsonResult(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return new JsonResult(new { success = false, message = ex.Message });
            }
        }
    }
}
