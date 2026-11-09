using PrintABC.Data;
using static PrintABC.Services.CatalogCalculatorService;
using static PrintABC.Utils.Helpers;

namespace PrintABC.Services
{
    public record CatalogQuoteRequest(CatalogSize Format, CatalogBinding Binding, int Pages, int InnerPaper, bool HasCover, int CoverPaper, string CoverPrint, LaminationType Lamination, int Quantity);
    public class CatalogCalculatorService
    {
        public enum CatalogSize { A4, A5, A6, }
        public enum CatalogBinding { Staple, Spiral }
        public enum LaminationType { None, Matte, Gloss }
        const decimal ClickColorIls = 0.13325m, UsdRateIls = 3.3m, StaplesPerCopyIls = 0.5m;
        const decimal MarkupThresholdIls = 200, MarkupLow = 5, MarkupHigh = 4.5m;
        const decimal LaminationUsdPerM2 = 0.37m, SheetAreaM2 = 0.16104m, WasteRate = 0.1m, VatRate = 0.18m;
        const int PunchSec = 30, SpiralCloseSec = 30, LaborRateIlsPerHour = 200, MinOrderIls = 100, MaxAutoPriceIls = 2000;

        public record PaperInfo(decimal SheetPriceIls, decimal ThicknessMm, int SheetsPerPunch, int StapleMaxPages, int SpiralMaxPages);
        private static PaperInfo GetPaperInfo(int paper) => paper switch
        {
            80 => new(0.091m, 0.1m, 20, 36, 200),
            130 => new(0.1485m, 0.115m, 17, 36, 150),
            170 => new(0.197m, 0.15m, 13, 8, 120),
            250 => new(0.29322m, 0.24m, 8, 8, 60),
            300 => new(0.35216m, 0.29m, 6, 0, 60),
            _ => throw new ArgumentOutOfRangeException(nameof(paper), paper, "Unsupported paper weight")
        };

        public static int[] GetInnerPaperSizes() => [80, 130, 170, 250, 300];

        public record CatalogSizeInfo(int PagesPerSheet, int CoversPerSheet, decimal SpiralLengthFactor);
        private static CatalogSizeInfo GetSizeInfo(CatalogSize size) => size switch
        {
            CatalogSize.A4 => new(4, 1, 1m),
            CatalogSize.A5 => new(8, 2, 0.71m),
            CatalogSize.A6 => new(16, 4, 0.5m),
            _ => throw new ArgumentOutOfRangeException(nameof(size), size, null)
        };

        public record Spiral(string Name, decimal DiameterMm, int MaxThicknessMm, decimal PriceA4Ils);
        public static readonly Spiral[] Spirals = [
            new (Name: "3/8", DiameterMm: 9.5m, MaxThicknessMm: 7, PriceA4Ils: 0.8m),
            new (Name: "7/16", DiameterMm:11, MaxThicknessMm:9, PriceA4Ils:0.92m),
            new (Name: "9/16", DiameterMm:14, MaxThicknessMm:12, PriceA4Ils:1.1m),
            new (Name: "5/8", DiameterMm:16, MaxThicknessMm:14, PriceA4Ils:1.25m),
            ];


        public CatalogQuoteResponse Calculate(CatalogQuoteRequest req)
        {
            if (req.Pages % 4 != 0)
                return CatalogQuoteResponse.Error("pages_step");

            int sheetsPerCopy = req.Pages / 2;
            PaperInfo innerPaper = GetPaperInfo(req.InnerPaper);
            PaperInfo coverPaper = GetPaperInfo(req.CoverPaper);
            CatalogSizeInfo format = GetSizeInfo(req.Format);
            int innerSheetsTotal = CeilDiv(req.Quantity * req.Pages, format.PagesPerSheet);

            decimal innerCost = innerSheetsTotal * (innerPaper.SheetPriceIls + 2 * ClickColorIls);

            int coverSheetsTotal = req.HasCover ? CeilDiv(req.Quantity, format.CoversPerSheet) : 0;

            decimal coverCost = 0;
            if (req.HasCover)
            {
                int coverPrintedSides = req.CoverPrint == "44" ? 2 : 1;
                coverCost = coverSheetsTotal * (coverPaper.SheetPriceIls + coverPrintedSides * ClickColorIls);
            }

            decimal laminationCost = 0;
            if (req.HasCover && req.Lamination != LaminationType.None)
            {
                decimal laminationPerSheet = LaminationUsdPerM2 * UsdRateIls * SheetAreaM2;
                laminationCost = coverSheetsTotal * laminationPerSheet;
            }

            decimal copyThicknessMm = sheetsPerCopy * innerPaper.ThicknessMm + (req.HasCover ? 2 * coverPaper.ThicknessMm : 0);

            decimal bindingMaterialsCost;
            decimal laborCost = 0;
            decimal? spiralDiameterMm = null;

            if (req.Binding == CatalogBinding.Staple)
            {
                bindingMaterialsCost = req.Quantity * StaplesPerCopyIls;
            }
            else
            {
                var spiral = Spirals.OrderBy(s => s.MaxThicknessMm).FirstOrDefault(s => copyThicknessMm <= s.MaxThicknessMm);
                if (spiral == null)
                    return CatalogQuoteResponse.Error("too_thick");
                spiralDiameterMm = spiral.DiameterMm;
                bindingMaterialsCost = req.Quantity * spiral.PriceA4Ils * format.SpiralLengthFactor;
                int punchesPerCopy = CeilDiv(sheetsPerCopy, innerPaper.SheetsPerPunch)
                            + (req.HasCover ? CeilDiv(2, coverPaper!.SheetsPerPunch) : 0);
                decimal secondsPerCopy = punchesPerCopy * PunchSec + SpiralCloseSec;
                laborCost = req.Quantity * secondsPerCopy * LaborRateIlsPerHour / 3600m;
            }

            decimal productionCost = innerCost + coverCost + laminationCost + bindingMaterialsCost + laborCost;

            decimal costWithWaste = productionCost * (1 + WasteRate);

            decimal markup = costWithWaste < MarkupThresholdIls ? MarkupLow : MarkupHigh;
            decimal calculatedPrice = Math.Round(costWithWaste * markup, 2);
            bool minApplied = calculatedPrice < MinOrderIls;
            decimal priceExVat = minApplied ? MinOrderIls : calculatedPrice;
            if (priceExVat > MaxAutoPriceIls)
                return new CatalogQuoteResponse() { Status = ValidationStatus.ManualQuote, ErrorCode = "" };
            decimal vat = Math.Round(priceExVat * VatRate, 2);
            decimal priceIncVat = priceExVat + vat;
            decimal pricePerCopy = Math.Round(priceIncVat / req.Quantity, 2);

            return new CatalogQuoteResponse()
            {
                ErrorCode = "",
                PriceExVatIls = priceExVat,
                PriceIncVatIls = priceIncVat,
                VatIls = vat,
                UnitPriceIncVatIls = pricePerCopy,
                Status = ValidationStatus.Ready
            };
        }

    }
}
