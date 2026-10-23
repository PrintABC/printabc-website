using PrintABC.Data;
using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;
using static PrintABC.Utils.Helpers;

namespace PrintABC.Services
{
    public enum OrderMessageStatus { Valid, PriceChanged, Expired, Invalid, BadFormat }
    public class OrderMessageService
    {
        private readonly IConfiguration _config;

        private readonly StickerCalculatorService _stickerCalculatorService;

        //without visually similar characters
        //private const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

        //private readonly byte[] _key;
        private const int ValidDays = 14;
        private const string TimeZone = "Asia/Jerusalem";


        public OrderMessageService(IConfiguration config, StickerCalculatorService stickerCalculatorService)
        {
            _config = config;
            _stickerCalculatorService = stickerCalculatorService;

            //_key = Convert.FromBase64String(_config["OrderMessage:key"]);
            
        }

        //public string MakeCode(string text)
        //{
        //    byte[] mac = HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(text));
        //    uint bits = BinaryPrimitives.ReadUInt32BigEndian(mac) >> 2;//first 30 bits
        //    Span<char> chars = stackalloc char[6];
        //    for (int i = 5; i >= 0; i--)
        //    {
        //        chars[i] = Alphabet[(int)(bits & 31)];  //5 bits per symbol
        //        bits >>= 5;
        //    }

        //    return new string(chars).ToUpper();
        //}

    }
}
