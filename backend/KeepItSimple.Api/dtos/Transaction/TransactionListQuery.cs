namespace KeepItSimple.Api.dtos.Transaction;

public class TransactionListQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int? PocketId { get; set; }
    public int? CategoryId { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string? Search { get; set; }
}
