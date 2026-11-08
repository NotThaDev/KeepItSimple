using System.Drawing;
using System.Globalization;
using KeepItSimple.Api.Models.Reports;
using OfficeOpenXml;
using OfficeOpenXml.Drawing.Chart;
using OfficeOpenXml.Table;

namespace KeepItSimple.Api.Helpers;

/// <summary>Renders a <see cref="ReportData"/> as an .xlsx workbook with EPPlus.</summary>
public static class ReportWorkbook
{
    private const string DateFormat = "yyyy-mm-dd";
    private const string PercentFormat = "0.0%";
    private const string NoData = "No transactions in this period.";
    private const int MaxSheetName = 31;
    // Long bank descriptions would otherwise widen a column until the rest of the sheet is off-screen.
    private const double MaxColumnWidth = 60;
    private static readonly Color Good = Color.FromArgb(0x1B, 0x7F, 0x3B);
    private static readonly Color Bad = Color.FromArgb(0xC0, 0x39, 0x2B);
    private static readonly Color HeaderFill = Color.FromArgb(0xE5, 0xE7, 0xEB);

    static ReportWorkbook()
    {
        ExcelPackage.License.SetNonCommercialPersonal("KeepItSimple");
    }

    public static byte[] Render(ReportData data)
    {
        using var package = new ExcelPackage();
        var used = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var summary = package.Workbook.Worksheets.Add(Reserve(used, "Summary"));
        summary.Cells[1, 1].Value = "KeepItSimple financial report";
        summary.Cells[1, 1].Style.Font.Size = 16;
        summary.Cells[1, 1].Style.Font.Bold = true;
        summary.Cells[2, 1].Value = $"{data.Range.Label} vs {data.Range.PreviousLabel}";
        summary.Cells[3, 1].Value = $"Generated {data.GeneratedAt.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)} UTC";
        WriteScopeBody(summary, data.Total, data, 5);

        WriteTrend(package.Workbook.Worksheets.Add(Reserve(used, "Trend")), data);
        WriteCategories(package.Workbook.Worksheets.Add(Reserve(used, "Expenses by category")), data, data.Total.ExpensesByCategory, income: false);
        WriteCategories(package.Workbook.Worksheets.Add(Reserve(used, "Income by category")), data, data.Total.IncomeByCategory, income: true);
        WriteTop(package.Workbook.Worksheets.Add(Reserve(used, "Top spending")), data);

        for (var i = 0; i < data.Pockets.Count; i++)
        {
            var scope = data.Pockets[i];
            var ws = package.Workbook.Worksheets.Add(Reserve(used, PocketSheetName(scope.Name, i + 1)));
            ws.Cells[1, 1].Value = scope.Name;
            ws.Cells[1, 1].Style.Font.Size = 14;
            ws.Cells[1, 1].Style.Font.Bold = true;
            WriteScopeBody(ws, scope, data, 3);
        }

        WriteTransactions(package.Workbook.Worksheets.Add(Reserve(used, "Transactions")), data);

        return package.GetAsByteArray();
    }

    // Excel sheet names: no []:*?/\, no leading/trailing ', max 31 chars, unique ignoring case.
    internal static string PocketSheetName(string pocketName, int index)
    {
        var cleaned = new string([.. pocketName.Where(c => !"[]:*?/\\".Contains(c))]).Trim().Trim('\'').Trim();
        var name = cleaned.Length == 0 ? $"Pocket {index}" : $"Pocket - {cleaned}";
        return name.Length > MaxSheetName ? name[..MaxSheetName].TrimEnd().TrimEnd('\'') : name;
    }

    private static string Reserve(HashSet<string> used, string name)
    {
        var candidate = name;
        for (var n = 2; !used.Add(candidate); n++)
        {
            var suffix = $" ({n})";
            candidate = name[..Math.Min(name.Length, MaxSheetName - suffix.Length)].TrimEnd() + suffix;
        }
        return candidate;
    }

    private static string MoneyFormat(string currency)
    {
        var symbol = currency.Equals("EUR", StringComparison.OrdinalIgnoreCase) ? "€" : currency.Replace("\"", string.Empty);
        return $"#,##0.00 \"{symbol}\"";
    }

    // KPI table, trend table, top-8 category table, then charts to the right.
    private static void WriteScopeBody(ExcelWorksheet ws, ReportScope scope, ReportData data, int row)
    {
        var money = MoneyFormat(scope.Currency);
        var kpiHeader = row;
        Header(ws, row, "Metric", data.Range.Label, data.Range.PreviousLabel, "Δ", "Δ%");
        var c = scope.Current;
        var p = scope.Previous;
        // lowerIsBetter: true = lower is good, false = higher is good, null = neutral.
        Kpi(ws, ++row, "Income", c.Income, p.Income, money, false);
        Kpi(ws, ++row, "Expenses", c.Expenses, p.Expenses, money, true);
        Kpi(ws, ++row, "Net", c.Net, p.Net, money, false);
        Kpi(ws, ++row, "Savings rate", c.SavingsRate, p.SavingsRate, PercentFormat, false, percentDelta: false);
        Kpi(ws, ++row, "Saved / invested", c.SavedInvested, p.SavedInvested, money, false);
        Kpi(ws, ++row, "Average daily expense", c.AverageDailyExpense, p.AverageDailyExpense, money, true);
        Kpi(ws, ++row, "Transactions", c.TransactionCount, p.TransactionCount, "0", null);
        Kpi(ws, ++row, "Largest expense", -(c.LargestExpense?.Amount ?? 0), -(p.LargestExpense?.Amount ?? 0), money, null);
        Kpi(ws, ++row, "Opening balance", c.OpeningBalance, p.OpeningBalance, money, null);
        Kpi(ws, ++row, "Closing balance", c.ClosingBalance, p.ClosingBalance, money, false);

        row += 2;
        var trendHeader = row;
        Header(ws, row, "Period", "Income", "Expenses", "Closing balance");
        foreach (var b in scope.Trend)
        {
            row++;
            ws.Cells[row, 1].Value = b.Label;
            ws.Cells[row, 2].Value = b.Income;
            ws.Cells[row, 3].Value = b.Expenses;
            ws.Cells[row, 4].Value = b.ClosingBalance;
        }
        var trendLast = row;
        ws.Cells[trendHeader + 1, 2, trendLast, 4].Style.Numberformat.Format = money;

        row += 2;
        var catHeader = row;
        Header(ws, row, "Expenses by category", "Amount");
        var top = scope.ExpensesByCategory.Where(r => r.Amount > 0).Take(8).ToList();
        var otherAmount = scope.ExpensesByCategory.Where(r => r.Amount > 0).Skip(8).Sum(r => r.Amount);
        foreach (var r in top)
        {
            row++;
            ws.Cells[row, 1].Value = r.Category;
            ws.Cells[row, 2].Value = r.Amount;
        }
        if (otherAmount > 0)
        {
            row++;
            ws.Cells[row, 1].Value = "All other categories";
            ws.Cells[row, 2].Value = otherAmount;
        }
        var catLast = row;
        if (catLast > catHeader)
        {
            ws.Cells[catHeader + 1, 2, catLast, 2].Style.Numberformat.Format = money;
        }

        ws.Cells.AutoFitColumns(ws.DefaultColWidth, MaxColumnWidth);

        if (c.TransactionCount == 0)
        {
            ws.Cells[kpiHeader, 7].Value = NoData;
            return;
        }

        // Zero-based: one empty row below the KPI header.
        var chartRow = kpiHeader + 1;
        if (scope.Trend.Any(b => b.Income != 0 || b.Expenses != 0))
        {
            var chart = ws.Drawings.AddChart("incomeVsExpenses", eChartType.ColumnClustered);
            chart.Title.Text = "Income vs expenses";
            chart.Series.Add(ws.Cells[trendHeader + 1, 2, trendLast, 2], ws.Cells[trendHeader + 1, 1, trendLast, 1]).Header = "Income";
            chart.Series.Add(ws.Cells[trendHeader + 1, 3, trendLast, 3], ws.Cells[trendHeader + 1, 1, trendLast, 1]).Header = "Expenses";
            Place(chart, chartRow, 6);
            chartRow += 17;
        }

        if (scope.Trend.Any(b => b.ClosingBalance != 0))
        {
            var chart = ws.Drawings.AddChart("closingBalance", eChartType.Line);
            chart.Title.Text = "Closing balance";
            chart.Series.Add(ws.Cells[trendHeader + 1, 4, trendLast, 4], ws.Cells[trendHeader + 1, 1, trendLast, 1]).Header = "Closing balance";
            Place(chart, chartRow, 6);
            chartRow += 17;
        }

        if (catLast > catHeader)
        {
            var chart = ws.Drawings.AddChart("expensesByCategory", eChartType.Doughnut);
            chart.Title.Text = "Expenses by category";
            chart.Series.Add(ws.Cells[catHeader + 1, 2, catLast, 2], ws.Cells[catHeader + 1, 1, catLast, 1]);
            Place(chart, chartRow, 6);
        }
    }

    private static void Kpi(ExcelWorksheet ws, int row, string name, decimal current, decimal previous, string format, bool? lowerIsBetter, bool percentDelta = true)
    {
        ws.Cells[row, 1].Value = name;
        ws.Cells[row, 2].Value = current;
        ws.Cells[row, 3].Value = previous;
        ws.Cells[row, 4].Value = current - previous;
        ws.Cells[row, 2, row, 4].Style.Numberformat.Format = format;
        if (percentDelta && previous != 0)
        {
            ws.Cells[row, 5].Value = (current - previous) / Math.Abs(previous);
            ws.Cells[row, 5].Style.Numberformat.Format = PercentFormat;
        }
        var delta = current - previous;
        if (lowerIsBetter is { } lower && delta != 0)
        {
            var good = lower ? delta < 0 : delta > 0;
            ws.Cells[row, 4, row, 5].Style.Font.Color.SetColor(good ? Good : Bad);
        }
    }

    private static void WriteTrend(ExcelWorksheet ws, ReportData data)
    {
        var money = MoneyFormat(data.Currency);
        Header(ws, 1, "Period", "Start", "Income", "Expenses", "Net", "Cumulative net", "Closing balance");
        var trend = data.Total.Trend;
        for (var i = 0; i < trend.Count; i++)
        {
            var b = trend[i];
            var r = i + 2;
            ws.Cells[r, 1].Value = b.Label;
            ws.Cells[r, 2].Value = b.Start;
            ws.Cells[r, 3].Value = b.Income;
            ws.Cells[r, 4].Value = b.Expenses;
            ws.Cells[r, 5].Value = b.Net;
            ws.Cells[r, 6].Value = b.CumulativeNet;
            ws.Cells[r, 7].Value = b.ClosingBalance;
        }
        var last = trend.Count + 1;
        ws.Cells[2, 2, last, 2].Style.Numberformat.Format = DateFormat;
        ws.Cells[2, 3, last, 7].Style.Numberformat.Format = money;
        ws.View.FreezePanes(2, 1);
        ws.Cells.AutoFitColumns(ws.DefaultColWidth, MaxColumnWidth);

        if (data.Total.Current.TransactionCount == 0)
        {
            ws.Cells[1, 9].Value = NoData;
            return;
        }

        var chart = ws.Drawings.AddChart("trend", eChartType.ColumnClustered);
        chart.Title.Text = "Income, expenses and cumulative net";
        chart.Series.Add(ws.Cells[2, 3, last, 3], ws.Cells[2, 1, last, 1]).Header = "Income";
        chart.Series.Add(ws.Cells[2, 4, last, 4], ws.Cells[2, 1, last, 1]).Header = "Expenses";
        var line = chart.PlotArea.ChartTypes.Add(eChartType.Line);
        line.Series.Add(ws.Cells[2, 6, last, 6], ws.Cells[2, 1, last, 1]).Header = "Cumulative net";
        Place(chart, 2, 8);
    }

    private static void WriteCategories(ExcelWorksheet ws, ReportData data, List<ReportCategoryRow> rows, bool income)
    {
        var money = MoneyFormat(data.Currency);
        Header(ws, 1, "Category", "Amount", "Share", "Count", "Average", "Previous period", "Δ");
        for (var i = 0; i < rows.Count; i++)
        {
            var r = i + 2;
            var row = rows[i];
            ws.Cells[r, 1].Value = row.Category;
            ws.Cells[r, 2].Value = row.Amount;
            ws.Cells[r, 3].Value = row.Share;
            ws.Cells[r, 4].Value = row.Count;
            ws.Cells[r, 5].Value = row.Average;
            ws.Cells[r, 6].Value = row.PreviousAmount;
            ws.Cells[r, 7].Value = row.Delta;
        }
        var last = rows.Count + 1;
        if (rows.Count > 0)
        {
            ws.Cells[2, 2, last, 2].Style.Numberformat.Format = money;
            ws.Cells[2, 3, last, 3].Style.Numberformat.Format = PercentFormat;
            ws.Cells[2, 5, last, 7].Style.Numberformat.Format = money;
            ws.ConditionalFormatting.AddDatabar(ws.Cells[2, 3, last, 3], Color.SteelBlue);
        }
        ws.View.FreezePanes(2, 1);
        ws.Cells.AutoFitColumns(ws.DefaultColWidth, MaxColumnWidth);

        if (!rows.Any(r => r.Amount > 0 || r.PreviousAmount > 0))
        {
            ws.Cells[1, 9].Value = NoData;
            return;
        }

        if (income)
        {
            var pie = ws.Drawings.AddChart("incomePie", eChartType.Pie);
            pie.Title.Text = "Income by category";
            pie.Series.Add(ws.Cells[2, 2, last, 2], ws.Cells[2, 1, last, 1]);
            Place(pie, 2, 8);
        }
        else
        {
            var bar = ws.Drawings.AddChart("expensesBar", eChartType.BarClustered);
            bar.Title.Text = "Expenses: this period vs previous";
            bar.Series.Add(ws.Cells[2, 2, last, 2], ws.Cells[2, 1, last, 1]).Header = data.Range.Label;
            bar.Series.Add(ws.Cells[2, 6, last, 6], ws.Cells[2, 1, last, 1]).Header = data.Range.PreviousLabel;
            Place(bar, 2, 8);
        }
    }

    private static void WriteTop(ExcelWorksheet ws, ReportData data)
    {
        var money = MoneyFormat(data.Currency);
        var expenses = data.Total.TopExpenses;
        ws.Cells[1, 1].Value = "Top 10 expenses";
        ws.Cells[1, 1].Style.Font.Bold = true;
        Header(ws, 2, "Date", "Pocket", "Description", "Category", "Amount");
        for (var i = 0; i < expenses.Count; i++)
        {
            var r = i + 3;
            ws.Cells[r, 1].Value = expenses[i].Date;
            ws.Cells[r, 2].Value = expenses[i].Pocket;
            ws.Cells[r, 3].Value = expenses[i].Description;
            ws.Cells[r, 4].Value = expenses[i].Category;
            ws.Cells[r, 5].Value = -expenses[i].Amount;
        }
        if (expenses.Count > 0)
        {
            ws.Cells[3, 1, expenses.Count + 2, 1].Style.Numberformat.Format = DateFormat;
            ws.Cells[3, 5, expenses.Count + 2, 5].Style.Numberformat.Format = money;
        }

        var start = expenses.Count + 5;
        ws.Cells[start, 1].Value = "Top 10 descriptions";
        ws.Cells[start, 1].Style.Font.Bold = true;
        Header(ws, start + 1, "Description", "Count", "Total");
        var descriptions = data.Total.TopDescriptions;
        for (var i = 0; i < descriptions.Count; i++)
        {
            var r = start + 2 + i;
            ws.Cells[r, 1].Value = descriptions[i].Description;
            ws.Cells[r, 2].Value = descriptions[i].Count;
            ws.Cells[r, 3].Value = descriptions[i].Total;
        }
        if (descriptions.Count > 0)
        {
            ws.Cells[start + 2, 3, start + 1 + descriptions.Count, 3].Style.Numberformat.Format = money;
        }
        if (expenses.Count == 0)
        {
            ws.Cells[1, 7].Value = NoData;
        }
        ws.Cells.AutoFitColumns(ws.DefaultColWidth, MaxColumnWidth);
    }

    private static void WriteTransactions(ExcelWorksheet ws, ReportData data)
    {
        string[] headers = ["Date", "Pocket", "Description", "Category", "Type", "Amount"];
        Header(ws, 1, headers);
        var rows = data.Transactions;
        if (rows.Count == 0)
        {
            ws.Cells[2, 1].Value = NoData;
            ws.View.FreezePanes(2, 1);
            ws.Cells.AutoFitColumns(ws.DefaultColWidth, MaxColumnWidth);
            return;
        }

        for (var i = 0; i < rows.Count; i++)
        {
            var r = i + 2;
            ws.Cells[r, 1].Value = rows[i].Date;
            ws.Cells[r, 2].Value = rows[i].Pocket;
            ws.Cells[r, 3].Value = rows[i].Description;
            ws.Cells[r, 4].Value = rows[i].Category;
            ws.Cells[r, 5].Value = rows[i].Type;
            ws.Cells[r, 6].Value = rows[i].Amount;
        }
        var last = rows.Count + 1;
        ws.Cells[2, 1, last, 1].Style.Numberformat.Format = DateFormat;
        ws.Cells[2, 6, last + 1, 6].Style.Numberformat.Format = MoneyFormat(data.Currency);

        var table = ws.Tables.Add(ws.Cells[1, 1, last, headers.Length], "TransactionsTable");
        table.TableStyle = TableStyles.Medium2;
        table.ShowTotal = true;
        table.Columns[5].TotalsRowFunction = RowFunctions.Sum;
        ws.View.FreezePanes(2, 1);
        ws.Cells.AutoFitColumns(ws.DefaultColWidth, MaxColumnWidth);
    }

    private static void Header(ExcelWorksheet ws, int row, params string[] titles)
    {
        for (var i = 0; i < titles.Length; i++)
        {
            ws.Cells[row, i + 1].Value = titles[i];
        }
        var range = ws.Cells[row, 1, row, titles.Length];
        range.Style.Font.Bold = true;
        range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
        range.Style.Fill.BackgroundColor.SetColor(HeaderFill);
    }

    private static void Place(ExcelChart chart, int row, int column)
    {
        chart.SetPosition(row, 0, column, 10);
        chart.SetSize(520, 300);
    }
}
