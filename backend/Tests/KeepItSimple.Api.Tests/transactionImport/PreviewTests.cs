using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Tests.Support;

namespace KeepItSimple.Api.Tests.TransactionImport;

/// <summary>
/// Step 2 of the import flow: applying the user mapping to build draft transactions.
/// Nothing is persisted here, so these tests need no database.
/// </summary>
public class PreviewTests
{
    /// <summary>Supplied by the UI on preview, never read from the file.</summary>
    private const int PocketId = 42;

    private const string StandardStatement = "transactions.xlsx";

    [Theory]
    [MemberData(nameof(ImportFixtures.StandardStatements), MemberType = typeof(ImportFixtures))]
    public void Preview_builds_one_draft_per_non_empty_row(string fileName)
    {
        var response = PreviewStatement(fileName);

        // Seven rows follow the header, one of them blank.
        Assert.Equal(6, response.Transactions.Count);
        Assert.Empty(response.Errors);
    }

    [Theory]
    [MemberData(nameof(ImportFixtures.StandardStatements), MemberType = typeof(ImportFixtures))]
    public void Preview_maps_the_mapped_columns_onto_transaction_fields(string fileName)
    {
        var salary = PreviewStatement(fileName).Transactions[0];

        Assert.Equal("Salary", salary.Description);
        Assert.Equal(2500m, salary.Amount);
        Assert.Equal(new DateTime(2026, 3, 1), salary.Date);
        Assert.Equal(PocketId, salary.PocketId);
    }

    [Theory]
    [MemberData(nameof(ImportFixtures.StandardStatements), MemberType = typeof(ImportFixtures))]
    public void Preview_keeps_expenses_negative_and_income_positive(string fileName)
    {
        var response = PreviewStatement(fileName);

        Assert.Equal(
            [2500m, -82.45m, -1.20m, -750m, 134.90m, -45m],
            response.Transactions.Select(transaction => transaction.Amount));
    }

    /// <summary>The blank row must be dropped, not carried through as a shifted or empty draft.</summary>
    [Theory]
    [MemberData(nameof(ImportFixtures.StandardStatements), MemberType = typeof(ImportFixtures))]
    public void Preview_does_not_let_the_blank_row_shift_later_rows(string fileName)
    {
        var response = PreviewStatement(fileName);

        Assert.Equal(new DateTime(2026, 3, 5), response.Transactions[3].Date);
        Assert.Equal("Rent", response.Transactions[3].Description);
    }

    /// <summary>Postgres maps DateTime to timestamptz, which rejects a non-UTC Kind.</summary>
    [Fact]
    public void Preview_marks_every_date_as_utc()
    {
        var response = PreviewStatement(StandardStatement);

        Assert.All(response.Transactions, transaction => Assert.Equal(DateTimeKind.Utc, transaction.Date.Kind));
    }

    [Fact]
    public void Preview_applies_the_default_category_when_no_column_is_mapped_to_it()
    {
        var response = PreviewStatement(StandardStatement, Transaction.TransactionCategory.Savings);

        Assert.All(
            response.Transactions,
            transaction => Assert.Equal(Transaction.TransactionCategory.Savings, transaction.Category));
    }

    [Fact]
    public void Preview_ignores_the_columns_mapped_to_ignore()
    {
        // "Currency" holds "EUR" on every row; mapped to Ignore it must not reach any field.
        var response = PreviewStatement(StandardStatement);

        Assert.DoesNotContain("EUR", response.Transactions.Select(transaction => transaction.Description));
    }

    [Fact]
    public void Preview_rejects_a_mapping_without_an_amount_column()
    {
        var exception = Assert.Throws<ArgumentException>(() => Preview(
            ImportFixtures.Analyze(StandardStatement),
            ImportFixtures.MapInOrder(1, "Date", "Description", "Ignore", "Ignore")));

        Assert.Contains("Amount", exception.Message);
    }

    [Fact]
    public void Preview_rejects_a_mapping_without_a_date_column()
    {
        var exception = Assert.Throws<ArgumentException>(() => Preview(
            ImportFixtures.Analyze(StandardStatement),
            ImportFixtures.MapInOrder(1, "Ignore", "Description", "Amount", "Ignore")));

        Assert.Contains("Date", exception.Message);
    }

    [Fact]
    public void Preview_rejects_a_target_field_mapped_twice()
    {
        var exception = Assert.Throws<ArgumentException>(() => Preview(
            ImportFixtures.Analyze(StandardStatement),
            ImportFixtures.MapInOrder(1, "Date", "Amount", "Amount", "Ignore")));

        Assert.Contains("Duplicate mappings", exception.Message);
    }

    [Fact]
    public void Preview_rejects_an_unknown_session()
    {
        var request = new TransactionImportHelper.PreviewRequest
        {
            SessionId = Guid.NewGuid(),
            PocketId = PocketId,
            Mapping = ImportFixtures.MapInOrder(1, "Date", "Description", "Amount", "Ignore"),
        };

        Assert.Throws<KeyNotFoundException>(() => TransactionImportHelper.Preview(request));
    }

    /// <summary>
    /// The session survives a preview, so the user can go back and remap columns without
    /// re-uploading the file.
    /// </summary>
    [Fact]
    public void Preview_can_be_replayed_on_the_same_session_with_a_new_mapping()
    {
        var analyzed = ImportFixtures.Analyze(StandardStatement);

        var byDetails = Preview(analyzed, ImportFixtures.MapInOrder(1, "Date", "Description", "Amount", "Ignore"));
        var byCurrency = Preview(analyzed, ImportFixtures.MapInOrder(1, "Date", "Ignore", "Amount", "Description"));

        Assert.Equal("Salary", byDetails.Transactions[0].Description);
        Assert.Equal("EUR", byCurrency.Transactions[0].Description);
        Assert.Equal(analyzed.SessionId, byCurrency.SessionId);
    }

    [Fact]
    public void Preview_parses_amounts_written_with_either_decimal_convention()
    {
        var response = PreviewMessyFormats();

        Assert.Equal(
            [1234.56m, 1234.56m, -45.90m, -12m],
            response.Transactions.Select(transaction => transaction.Amount));
        Assert.Empty(response.Errors);
    }

    [Fact]
    public void Preview_parses_eu_us_and_two_digit_date_formats()
    {
        var response = PreviewMessyFormats();

        Assert.Equal(
            [
                new DateTime(2026, 3, 1),
                new DateTime(2026, 3, 2),
                new DateTime(2026, 3, 1),
                new DateTime(2026, 3, 4),
            ],
            response.Transactions.Select(transaction => transaction.Date));
    }

    [Fact]
    public void Preview_matches_categories_by_enum_name_and_falls_back_when_unknown()
    {
        var response = PreviewMessyFormats();

        Assert.Equal(
            [
                Transaction.TransactionCategory.Salary,
                Transaction.TransactionCategory.Food,
                Transaction.TransactionCategory.Other,
                Transaction.TransactionCategory.Transport,
            ],
            response.Transactions.Select(transaction => transaction.Category));
    }

    [Fact]
    public void Preview_returns_the_parsable_rows_even_when_others_fail()
    {
        var response = PreviewInvalidRows();

        Assert.Equal(
            ["Valid one", "Valid two"],
            response.Transactions.Select(transaction => transaction.Description));
    }

    /// <summary>Errors are numbered against the sheet, so the UI can point the user at a row.</summary>
    [Fact]
    public void Preview_reports_each_unparsable_row_with_its_sheet_number()
    {
        var response = PreviewInvalidRows();

        Assert.Collection(
            response.Errors,
            error =>
            {
                Assert.StartsWith("Row 3:", error);
                Assert.Contains("Cannot parse date 'not-a-date'", error);
            },
            error =>
            {
                Assert.StartsWith("Row 4:", error);
                Assert.Contains("Cannot parse amount 'abc'", error);
            },
            error =>
            {
                Assert.StartsWith("Row 6:", error);
                Assert.Contains("Missing or invalid Amount", error);
            });
    }

    private static TransactionImportHelper.PreviewResponse PreviewStatement(
        string fileName,
        Transaction.TransactionCategory defaultCategory = Transaction.TransactionCategory.Other)
    {
        return Preview(
            ImportFixtures.Analyze(fileName),
            ImportFixtures.MapInOrder(1, "Date", "Description", "Amount", "Ignore"),
            defaultCategory);
    }

    private static TransactionImportHelper.PreviewResponse PreviewMessyFormats()
    {
        return Preview(
            ImportFixtures.Analyze(ExcelFixtureGenerator.MessyFormatsFile),
            ImportFixtures.MapInOrder(1, "Date", "Description", "Amount", "Category"));
    }

    private static TransactionImportHelper.PreviewResponse PreviewInvalidRows()
    {
        return Preview(
            ImportFixtures.Analyze(ExcelFixtureGenerator.InvalidRowsFile),
            ImportFixtures.MapInOrder(1, "Date", "Description", "Amount"));
    }

    private static TransactionImportHelper.PreviewResponse Preview(
        TransactionImportHelper.AnalyzeResponse analyzed,
        List<TransactionImportHelper.ColumnMapping> mapping,
        Transaction.TransactionCategory defaultCategory = Transaction.TransactionCategory.Other)
    {
        return TransactionImportHelper.Preview(new TransactionImportHelper.PreviewRequest
        {
            SessionId = analyzed.SessionId,
            PocketId = PocketId,
            Mapping = mapping,
            DefaultCategory = defaultCategory,
        });
    }
}
