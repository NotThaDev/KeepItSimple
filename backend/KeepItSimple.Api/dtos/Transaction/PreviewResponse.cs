namespace KeepItSimple.Api.dtos.Transaction;

public class PreviewResponse
{
    public Guid SessionId { get; set; }
    public List<Models.Transaction> Transactions { get; set; } = [];
    public List<string> Errors { get; set; } = [];
}
