using PrintABC.Data;
using static PrintABC.Utils.Helpers;

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
            Paper = 0,
            WhiteFilm = 1,
            TransparentFilm = 2
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
        private const decimal MinimumOrderIls = 118m;
        private const decimal VatRate = 0.18m;
        private const decimal MaxAutoPriceIncVatIls = 1000m;
        private const decimal SingleCutSurchargeIls = 20m;

        private static readonly Dictionary<StickerMaterial, MaterialSpec> Materials = new()
        {
            [StickerMaterial.Paper] = new("paper", 0.50003m, 0.13325m),
            [StickerMaterial.WhiteFilm] = new("white_film", 2.58m, 0.13325m),
            [StickerMaterial.TransparentFilm] = new("transparent_film", 2.58m, 0.13325m)
        };
        public record QuoteRequest(StickerMaterial Material, ShapeType Shape, decimal DiameterMm, decimal WidthMm, decimal HeightMm, int Quantity, CutMode CutMode);
        private record MaterialSpec(string Name, decimal SheetCost, decimal ClickCost);
        private QuoteResponse ValidationError(string errorCode) => new()
        {
            Status = ValidationStatus.ValidationError,
            ErrorCode = errorCode
        };

        public QuoteResponse Calculate(QuoteRequest request)
        {
            if (request.Shape != ShapeType.Circle && request.Shape != ShapeType.Rectangle && request.Shape != ShapeType.Custom)
            {
                return ValidationError("shape");
            }

            if (request.Quantity < 1)
            {
                return ValidationError("qty");
            }

            bool sizeOk = request.Shape == ShapeType.Circle
                ? request.DiameterMm >= 0.1m
                : request.WidthMm >= 0.1m && request.HeightMm >= 0.1m;
            if (!sizeOk) return ValidationError("size");


            if (request.Shape == ShapeType.Circle && request.DiameterMm > UsableWidth)
            {
                return ValidationError("big");
            }

            decimal gap = request.CutMode == CutMode.Separate ? 5m : 2m;

            int stickersPerSheet = 0;

            if (request.Shape == ShapeType.Circle)
                stickersPerSheet = CalculateStickersPerSheet(request.Shape, request.DiameterMm, request.DiameterMm, gap);
            else
                stickersPerSheet = CalculateStickersPerSheet(request.Shape, request.WidthMm, request.HeightMm, gap);

            if (stickersPerSheet == 0)
            {
                return ValidationError("big");
            }

            int productionSheets = (int)Math.Ceiling((decimal)request.Quantity / stickersPerSheet);
            int printSheets = productionSheets + SpareSheets;

            var material = Materials[request.Material];
            decimal materialAndClickCostPerSheet = material.SheetCost + material.ClickCost;
            decimal printCost = printSheets * materialAndClickCostPerSheet;

            decimal perimeter = request.Shape switch
            {
                ShapeType.Circle => (decimal)Math.PI * request.DiameterMm,
                ShapeType.Rectangle or ShapeType.Custom => 2m * (request.WidthMm + request.HeightMm),
                _ => 0m
            };

            decimal cutTimeSec = (productionSheets * CropReadSecPerSheet)
                                 + ((perimeter * request.Quantity) / EffectiveCutSpeedMmSec)
                                 + (request.Quantity * ContourStartStopSec);

            decimal cutCost = (cutTimeSec / 3600m) * CutHourlyRateIls;

            decimal prepCost = (PreparationMinutes / 60m) * CutHourlyRateIls;

            decimal surcharge = request.CutMode == CutMode.Separate ? SingleCutSurchargeIls : 0m;

            decimal rawTotal = prepCost + printCost + cutCost + surcharge;
            decimal priceExVat = Math.Round(rawTotal, 2, MidpointRounding.AwayFromZero);

            decimal vat = Math.Round(priceExVat * VatRate, 2, MidpointRounding.AwayFromZero);
            decimal priceIncVat = priceExVat + vat;
            string errorCode = "";
            ValidationStatus status = ValidationStatus.Ready;
            if (priceIncVat < MinimumOrderIls)
            {
                priceIncVat = MinimumOrderIls;
                errorCode = "min";//set to a nonexisting error due to the error not being needed right now
            }

            else if (priceIncVat > MaxAutoPriceIncVatIls)
            {
                priceIncVat = 0;
                errorCode = "price_max";
                status = ValidationStatus.ManualQuote;
            }

            decimal unitPriceExVat = Math.Round(priceExVat / request.Quantity, 4, MidpointRounding.AwayFromZero);

            return new QuoteResponse
            {
                Status = status,
                ErrorCode = errorCode,
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
