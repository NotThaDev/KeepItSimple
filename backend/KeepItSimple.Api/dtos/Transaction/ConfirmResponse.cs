namespace KeepItSimple.Api.dtos.Transaction;

public class ConfirmResponse
{
    public int SavedCount { get; set; }
    public List<Models.Transaction> Transactions { get; set; } = [];
}
