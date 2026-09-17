namespace KeepItSimple.Api.dtos.Transaction;

public class PagedTransactionsResponse
{
    public List<Models.Transaction> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
