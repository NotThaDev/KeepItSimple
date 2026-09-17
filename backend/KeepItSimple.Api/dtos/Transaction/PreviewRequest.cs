using System.Text.Json.Serialization;
using static KeepItSimple.Api.Helpers.TransactionImporter;

namespace KeepItSimple.Api.dtos.Transaction;

public class PreviewRequest
{
    public Guid SessionId { get; set; }
    public int PocketId { get; set; }
    public List<ColumnMapping> Mapping { get; set; } = [];

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Models.Transaction.TransactionCategory DefaultCategory { get; set; } = Models.Transaction.TransactionCategory.Other;
}
