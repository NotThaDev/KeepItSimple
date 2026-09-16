namespace KeepItSimple.Api.dtos.Transaction;

public class ConfirmRequest
{
    public Guid SessionId { get; set; }
    public int PocketId { get; set; }
    public List<Models.Transaction> Transactions { get; set; } = [];
}
