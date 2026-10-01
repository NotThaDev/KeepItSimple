namespace KeepItSimple.Api.dtos.Transaction;

public class TransferResponse
{
    public Models.Transaction Outgoing { get; set; } = null!;
    public Models.Transaction Incoming { get; set; } = null!;
}
