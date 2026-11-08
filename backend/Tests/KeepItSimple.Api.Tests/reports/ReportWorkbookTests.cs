using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Reports;
using OfficeOpenXml;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Tests.Reports;

public class ReportWorkbookTests
{
    private static readonly DateTime Now = new(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc);

    private static ExcelPackage Load(byte[] bytes)
    {
        ExcelPackage.License.SetNonCommercialPersonal("KeepItSimple");
        return new ExcelPackage(new MemoryStream(bytes));
    }

    private static ReportData Build(List<Transaction> txs, params Pocket[] pockets) =>
        ReportCalculator.Calculate(txs, pockets, ReportPeriodRange.Resolve(ReportPeriod.LastMonth, Now), Now);

    private static Transaction Tx(int pocketId, TransactionCategory category, decimal amount, int day) =>
        new() { PocketId = pocketId, Category = category, Amount = amount, Date = new DateTime(2026, 8, day, 9, 0, 0, DateTimeKind.Utc), Description = "x" };

    [Fact]
    public void Render_sample_data_has_expected_sheets_income_and_chart()
    {
        var data = Build(
        [
            Tx(1, TransactionCategory.Salary, 1500, 3),
            Tx(1, TransactionCategory.Food, -200, 4),
        ], new Pocket { Id = 1, Name = "Main", Balance = 1300, Currency = "EUR" });

        using var package = Load(ReportWorkbook.Render(data));

        Assert.Equal(
            ["Summary", "Trend", "Expenses by category", "Income by category", "Top spending", "Pocket - Main", "Transactions"],
            package.Workbook.Worksheets.Select(w => w.Name));
        var summary = package.Workbook.Worksheets["Summary"];
        Assert.Equal("Income", summary.Cells[6, 1].Text);
        Assert.Equal(1500d, Convert.ToDouble(summary.Cells[6, 2].Value));
        Assert.True(summary.Drawings.Count >= 1);
        Assert.Single(package.Workbook.Worksheets["Transactions"].Tables);
    }

    [Fact]
    public void Render_places_charts_below_frozen_header_rows()
    {
        var data = Build(
        [
            Tx(1, TransactionCategory.Salary, 1500, 3),
            Tx(1, TransactionCategory.Food, -200, 4),
        ], new Pocket { Id = 1, Name = "Main", Balance = 1300, Currency = "EUR" });

        using var package = Load(ReportWorkbook.Render(data));

        foreach (var ws in package.Workbook.Worksheets.Where(w => w.Drawings.Count > 0 && w.View.PaneSettings?.TopLeftCell is not null))
        {
            var frozenRows = new ExcelAddress(ws.View.PaneSettings.TopLeftCell).Start.Row - 1;
            // Drawing rows are zero-based; keep one empty row between the frozen header and the chart.
            Assert.All(ws.Drawings, d => Assert.True(d.From.Row > frozenRows, $"{ws.Name}/{d.Name} starts at row {d.From.Row}"));
        }
    }

    [Fact]
    public void Render_freezes_headers_only_on_single_table_sheets()
    {
        var data = Build(
        [
            Tx(1, TransactionCategory.Salary, 1500, 3),
            Tx(1, TransactionCategory.Food, -200, 4),
        ], new Pocket { Id = 1, Name = "Main", Balance = 1300, Currency = "EUR" });

        using var package = Load(ReportWorkbook.Render(data));

        string[] multiTable = ["Summary", "Top spending", "Pocket - Main"];
        Assert.All(multiTable, name => Assert.False(package.Workbook.Worksheets[name].View.PaneSettings?.State == ePaneState.Frozen, name));
        Assert.Equal(ePaneState.Frozen, package.Workbook.Worksheets["Transactions"].View.PaneSettings.State);
    }

    [Fact]
    public void Render_caps_column_width_for_long_descriptions()
    {
        var expense = Tx(1, TransactionCategory.Food, -200, 4);
        expense.Description = new string('x', 300);
        var data = Build([expense], new Pocket { Id = 1, Name = "Main", Balance = 1300, Currency = "EUR" });

        using var package = Load(ReportWorkbook.Render(data));

        Assert.All(package.Workbook.Worksheets, ws =>
            Assert.All(Enumerable.Range(1, 8), c => Assert.True(ws.Column(c).Width <= 60, $"{ws.Name} column {c}: {ws.Column(c).Width}")));
    }

    [Fact]
    public void Render_sanitizes_and_deduplicates_pocket_sheet_names()
    {
        var longName = new string('a', 40);
        var data = Build([],
            new Pocket { Id = 1, Name = "Bills/Rent: [home]", Balance = 0 },
            new Pocket { Id = 2, Name = longName, Balance = 0 },
            new Pocket { Id = 3, Name = longName.ToUpperInvariant(), Balance = 0 },
            new Pocket { Id = 4, Name = "[]", Balance = 0 });

        using var package = Load(ReportWorkbook.Render(data));
        var names = package.Workbook.Worksheets.Select(w => w.Name).ToList();

        Assert.Contains("Pocket - BillsRent home", names);
        Assert.Contains("Pocket 4", names);
        Assert.All(names, n => Assert.True(n.Length <= 31));
        Assert.Equal(names.Count, names.Select(n => n.ToLowerInvariant()).Distinct().Count());
        Assert.Contains(names, n => n.EndsWith("(2)"));
    }

    [Fact]
    public void Render_with_no_transactions_has_no_summary_charts()
    {
        var data = Build([], new Pocket { Id = 1, Name = "Main", Balance = 100 });

        using var package = Load(ReportWorkbook.Render(data));

        Assert.Empty(package.Workbook.Worksheets["Summary"].Drawings);
        Assert.Equal("No transactions in this period.", package.Workbook.Worksheets["Summary"].Cells[5, 7].Text);
    }
}
