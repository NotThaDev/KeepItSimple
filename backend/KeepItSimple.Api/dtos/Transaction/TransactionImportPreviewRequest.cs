using static KeepItSimple.Api.Helpers.TransactionImporter;

namespace KeepItSimple.Api.dtos.Transaction;

public class TransactionImportPreviewRequest
{
    public Guid SessionId { get; set; }
    public int PocketId { get; set; }
    public List<ColumnMapping> Mapping { get; set; } = [];

    // Must be visible to the user; Other when null.
    public int? DefaultCategoryId { get; set; }
}
