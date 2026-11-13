namespace PrintABC.Data
{
    public interface IWhatsappSendable
    {
        public string WhatsappMessage {  get; set; }

        public void CreateMessage();
    }
}
