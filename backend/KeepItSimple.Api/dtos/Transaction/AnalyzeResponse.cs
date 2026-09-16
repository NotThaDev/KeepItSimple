using ExcelColumn = KeepItSimple.Api.Helpers.TransactionImporter.ExcelColumn;
using MappableField = KeepItSimple.Api.Helpers.TransactionImporter.MappableField;

namespace KeepItSimple.Api.dtos.Transaction;

public class AnalyzeResponse
{
    public Guid SessionId { get; set; }
    public List<ExcelColumn> Columns { get; set; } = [];
    public List<Dictionary<string, string>> SampleRows { get; set; } = [];
    public MappableField[] MappableFields { get; set; } = [];
}
