using PrintABC.Data;

namespace PrintABC.Services
{
    public partial class StickerCalculatorService
    {
        public enum ShapeType { Circle, Rectangle, Custom }
        public enum CutMode
        {
            Normal,
            Separate
        }
        public enum StickerMaterial
        {
            Paper=0,
            WhiteFilm = 1,
            TransparentFilm= 2
        }
        //numbers are in Millimeters(mm)
        private const decimal SheetWidth = 330m;
        private const decimal SheetHeight = 488m;
        private const decimal MarginLeft = 10m;
        private const decimal MarginRight = 10m;
        private const decimal MarginTop = 20m;
        private const decimal MarginBottom = 10m;
        private const decimal UsableWidth = SheetWidth - MarginLeft - MarginRight;   //310mm
        private const decimal UsableHeight = SheetHeight - MarginTop - MarginBottom; //458mmm
        private const int SpareSheets = 3;
        private const decimal CropReadSecPerSheet = 15m;
        private const decimal EffectiveCutSpeedMmSec = 28m;
        private const decimal ContourStartStopSec = 0m;
        private const decimal CutHourlyRateIls = 200m;
        private const decimal PreparationMinutes = 20m;
        private const decimal MinimumOrderIls = 100m;
        private const decimal VatRate = 0.18m;
        private const decimal MaxAutoPriceIncVatIls = 1000m;
        private const decimal SingleCutSurchargeIls = 20m;

        private static readonly Dictionary<StickerMaterial, MaterialSpec> Materials = new()
        {
            [StickerMaterial.Paper] = new("paper", 0.50003m, 0.13325m),
            [StickerMaterial.WhiteFilm] = new("while_film", 2.58m, 0.13325m),
            [StickerMaterial.TransparentFilm] = new("transparent_film", 2.58m, 0.13325m)
        };
        public record QuoteRequest(StickerMaterial Material, ShapeType Shape, decimal WidthMm, decimal? HeightMm, int Quantity, CutMode CutMode);
        private record MaterialSpec(string Name, decimal SheetCost, decimal ClickCost);
        private QuoteResponse ValidationError(string errorCode) => new()
        {
            Status = "validation_error",
            ErrorCode = errorCode
        };

        public QuoteResponse Calculate(QuoteRequest request)
        {
            if (request.Shape != ShapeType.Circle && request.Shape != ShapeType.Rectangle  && request.Shape != ShapeType.Custom)
            {
                return ValidationError("shape");
            }

            if (request.Quantity < 1)
            {
                return ValidationError("quantity");
            }

            if (request.WidthMm < 1 || (request.Shape != ShapeType.Circle && request.HeightMm < 1))
            {
                return ValidationError("size");
            }

            if (request.Shape == ShapeType.Circle && request.WidthMm > UsableWidth)
            {
                return ValidationError("too_big");
            }

            decimal gap = request.CutMode == CutMode.Separate ? 5m : 2m;

            int stickersPerSheet = CalculateStickersPerSheet(request.Shape, request.WidthMm, request.HeightMm ?? request.WidthMm, gap);

            if (stickersPerSheet == 0)
            {
                return ValidationError("too_big");
            }

            int productionSheets = (int)Math.Ceiling((decimal)request.Quantity / stickersPerSheet);
            int printSheets = productionSheets + SpareSheets;

            var material = Materials[request.Material];
            decimal materialAndClickCostPerSheet = material.SheetCost + material.ClickCost;
            decimal printCost = printSheets * materialAndClickCostPerSheet;

            decimal perimeter = request.Shape switch
            {
                ShapeType.Circle => (decimal)Math.PI * request.WidthMm,
                ShapeType.Rectangle or ShapeType.Custom => 2m * (request.WidthMm + (request.HeightMm ?? request.WidthMm)),
                _ => 0m
            };

            decimal cutTimeSec = (productionSheets * CropReadSecPerSheet)
                                 + ((perimeter * request.Quantity) / EffectiveCutSpeedMmSec)
                                 + (request.Quantity * ContourStartStopSec);

            decimal cutCost = (cutTimeSec / 3600m) * CutHourlyRateIls;

            decimal prepCost = (PreparationMinutes / 60m) * CutHourlyRateIls;

            decimal surcharge = request.CutMode == CutMode.Separate ? SingleCutSurchargeIls : 0m;

            decimal rawTotal = prepCost + printCost + cutCost + surcharge;
            decimal priceExVat = Math.Round(Math.Max(MinimumOrderIls, rawTotal), 2, MidpointRounding.AwayFromZero);

            decimal vat = Math.Round(priceExVat * VatRate, 2, MidpointRounding.AwayFromZero);
            decimal priceIncVat = priceExVat + vat;

            decimal unitPriceExVat = Math.Round(priceExVat / request.Quantity, 4, MidpointRounding.AwayFromZero);

            if (priceIncVat > MaxAutoPriceIncVatIls)
            {
                return new QuoteResponse
                {
                    Status = "manual_quote",
                    ErrorCode = ""
                };
            }

            return new QuoteResponse
            {
                Status = "ready",
                ErrorCode = "",
                StickersPerSheet = stickersPerSheet,
                ProductionSheets = productionSheets,
                PrintSheets = printSheets,
                CutTimeSec = Math.Round((double)cutTimeSec, 2),
                PriceExVatIls = priceExVat,
                VatIls = vat,
                PriceIncVatIls = priceIncVat,
                UnitPriceExVatIls = unitPriceExVat
            };
        }

        private int CalculateStickersPerSheet(ShapeType shape, decimal width, decimal height, decimal gap)
        {
            if (shape == ShapeType.Circle)
            {
                if (width > UsableWidth) return 0;
                int cols = (int)Math.Floor((UsableWidth + gap) / (width + gap));
                int rows = (int)Math.Floor((UsableHeight + gap) / (width + gap));
                return cols * rows;
            }
            else //rectangle or custom
            {
                int f1Cols = (int)Math.Floor((UsableWidth + gap) / (width + gap));
                int f1Rows = (int)Math.Floor((UsableHeight + gap) / (height + gap));
                int f1 = f1Cols * f1Rows;

                int f2Cols = (int)Math.Floor((UsableWidth + gap) / (height + gap));
                int f2Rows = (int)Math.Floor((UsableHeight + gap) / (width + gap));
                int f2 = f2Cols * f2Rows;

                return Math.Max(f1, f2);
            }
        }
    }
}
