using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Tests.Support;

namespace KeepItSimple.Api.Tests.TransactionImport;

/// <summary>
/// Step 1 of the import flow: discovering columns from a file whose layout is unknown.
/// </summary>
public class AnalyzeTests
{
    [Theory]
    [MemberData(nameof(ImportFixtures.StandardStatements), MemberType = typeof(ImportFixtures))]
    public void Analyze_discovers_every_header_column(string fileName)
    {
        var response = ImportFixtures.Analyze(fileName);
        Assert.Equal(
            ["Date", "Details", "Amount", "Currency"],
            response.Columns.Select(column => column.Name));
        Assert.Equal([1, 2, 3, 4], response.Columns.Select(column => column.Index));
    }

    [Theory]
    [MemberData(nameof(ImportFixtures.StandardStatements), MemberType = typeof(ImportFixtures))]
    public void Analyze_formats_date_and_numeric_cells_as_text_samples(string fileName)
    {
        var response = ImportFixtures.Analyze(fileName);

        var first = response.SampleRows[0];
        Assert.Equal("01/03/2026", first["Date"]);
        Assert.Equal("Salary", first["Details"]);
        Assert.Equal("2500", first["Amount"]);
        Assert.Equal("EUR", first["Currency"]);
    }

    [Fact]
    public void Analyze_advertises_the_mappable_target_fields()
    {
        var response = ImportFixtures.Analyze("transactions.xlsx");

        Assert.Equal(TransactionImporter.MappableFields, response.MappableFields);
    }

    [Fact]
    public void Analyze_returns_a_fresh_session_per_upload()
    {
        var first = ImportFixtures.Analyze("transactions.xlsx");
        var second = ImportFixtures.Analyze("transactions.xlsx");

        Assert.NotEqual(Guid.Empty, first.SessionId);
        Assert.NotEqual(first.SessionId, second.SessionId);
    }

    /// <summary>
    /// The header is not simply the first row: preamble rows are skipped until one holds at least
    /// three consecutive text cells, and numeric cells never qualify.
    /// </summary>
    [Fact]
    public void Analyze_skips_preamble_rows_before_the_header()
    {
        var response = ImportFixtures.Analyze(ExcelFixtureGenerator.WithPreambleFile);

        Assert.Equal(
            ["Value date", "Transaction description", "Amount", "Currency"],
            response.Columns.Select(column => column.Name));
    }

    /// <summary>Indexes are 1-based positions in the sheet, not positions in the column list.</summary>
    [Fact]
    public void Analyze_reports_one_based_sheet_indexes()
    {
        var response = ImportFixtures.Analyze(ExcelFixtureGenerator.WithPreambleFile);

        Assert.Equal([2, 3, 4, 5], response.Columns.Select(column => column.Index));
    }

    [Fact]
    public void Analyze_rejects_a_file_without_a_text_header_row()
    {
        using var stream = ImportFixtures.Open(ExcelFixtureGenerator.NoHeaderFile);

        var exception = Assert.Throws<InvalidOperationException>(
            () => TransactionImporter.Analyze(stream));

        Assert.Contains("No header row found", exception.Message);
    }
}
