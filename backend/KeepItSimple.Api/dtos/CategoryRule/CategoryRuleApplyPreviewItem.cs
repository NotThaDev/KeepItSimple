namespace KeepItSimple.Api.dtos.CategoryRule;

public class CategoryRuleApplyPreviewItem
{
    public int TransactionId { get; set; }
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }

    public int OldCategoryId { get; set; }
    public int NewCategoryId { get; set; }

    public int MatchedRuleId { get; set; }
    public string MatchedRuleName { get; set; } = string.Empty;
}
