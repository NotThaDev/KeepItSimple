namespace KeepItSimple.Api.dtos.Transaction;

public class TransferRequest
{
    public int FromPocketId { get; set; }
    public int ToPocketId { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Description { get; set; }
}
