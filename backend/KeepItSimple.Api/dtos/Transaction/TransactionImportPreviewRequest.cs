using System.Text.Json.Serialization;
using static KeepItSimple.Api.Helpers.TransactionImporter;

namespace KeepItSimple.Api.dtos.Transaction;

public class TransactionImportPreviewRequest
{
    public Guid SessionId { get; set; }
    public int PocketId { get; set; }
    public List<ColumnMapping> Mapping { get; set; } = [];

    // Wins over the legacy DefaultCategory; must be visible to the user.
    public int? DefaultCategoryId { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Models.Transaction.TransactionCategory DefaultCategory { get; set; } = Models.Transaction.TransactionCategory.Other;
}
