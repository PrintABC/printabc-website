using static PrintABC.Utils.Helpers;

namespace PrintABC.Data
{
    public class CatalogQuoteResponse
    {
        public ValidationStatus Status { get; set; }
        public required string ErrorCode { get; set; }
        public decimal? PriceExVatIls { get; set; }
        public decimal? VatIls { get; set; }
        public decimal? PriceIncVatIls { get; set; }
        public decimal? UnitPriceIncVatIls { get; set; }

        public static CatalogQuoteResponse Error(string errorCode) => new() { Status = ValidationStatus.ValidationError, ErrorCode = errorCode };


    }
}

