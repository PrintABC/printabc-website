using static PrintABC.Utils.Helpers;

namespace PrintABC.Data
{
    public class QuoteResponse
    {
        public ValidationStatus Status { get; set; }
        public required string ErrorCode { get; set; }
        public int? StickersPerSheet { get; set; }
        public int? ProductionSheets { get; set; }
        public int? PrintSheets { get; set; }
        public double? CutTimeSec { get; set; }
        public decimal? PriceExVatIls { get; set; }
        public decimal? VatIls { get; set; }
        public decimal? PriceIncVatIls { get; set; }
        public decimal? UnitPriceExVatIls { get; set; }
    }

}
