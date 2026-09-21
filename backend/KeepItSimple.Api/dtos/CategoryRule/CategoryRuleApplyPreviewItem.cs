using System.Text.Json.Serialization;

namespace KeepItSimple.Api.dtos.CategoryRule;

public class CategoryRuleApplyPreviewItem
{
    public int TransactionId { get; set; }
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public global::KeepItSimple.Api.Models.Transaction.TransactionCategory OldCategory { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public global::KeepItSimple.Api.Models.Transaction.TransactionCategory NewCategory { get; set; }

    public int MatchedRuleId { get; set; }
    public string MatchedRuleName { get; set; } = string.Empty;
}
