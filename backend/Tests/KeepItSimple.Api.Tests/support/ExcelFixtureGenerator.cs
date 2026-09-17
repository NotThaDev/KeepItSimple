using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;

namespace KeepItSimple.Api.Tests.Support;

/// <summary>
/// Writes the binary Excel/CSV fixtures consumed by the transaction import tests.
/// Files are generated into the test output directory at run time; they are not committed.
/// </summary>
public static class ExcelFixtureGenerator
{
    /// <summary>Same statement written once per extension supported by the import endpoint.</summary>
    public static readonly string[] StandardStatementFiles =
    [
        "transactions.xls",
        "transactions.xlsx",
        "transactions.xlsm",
        "transactions.csv",
    ];

    public const string WithPreambleFile = "with-preamble.xlsx";
    public const string MessyFormatsFile = "messy-formats.xlsx";
    public const string InvalidRowsFile = "invalid-rows.xlsx";
    public const string NoHeaderFile = "no-header.xlsx";

    public static void WriteAll(string targetDirectory)
    {
        Directory.CreateDirectory(targetDirectory);

        foreach (var fileName in StandardStatementFiles)
        {
            var path = Path.Combine(targetDirectory, fileName);
            if (Path.GetExtension(fileName).Equals(".csv", StringComparison.OrdinalIgnoreCase))
            {
                WriteStandardCsv(path);
                continue;
            }

            Write(path, BuildStandardStatement);
        }

        Write(Path.Combine(targetDirectory, WithPreambleFile), BuildStatementWithPreamble);
        Write(Path.Combine(targetDirectory, MessyFormatsFile), BuildMessyFormats);
        Write(Path.Combine(targetDirectory, InvalidRowsFile), BuildInvalidRows);
        Write(Path.Combine(targetDirectory, NoHeaderFile), BuildWithoutHeader);
    }

    /// <summary>
    /// Plain statement: header on row 1, real date cells, numeric amounts and a blank row
    /// in the middle. Identical across .xls / .xlsx / .xlsm / .csv so a single theory can cover them.
    /// </summary>
    private static void BuildStandardStatement(IWorkbook workbook)
    {
        var sheet = workbook.CreateSheet("Transactions");
        var dateStyle = CreateDateStyle(workbook);

        WriteStringRow(sheet, rowIndex: 0, "Date", "Details", "Amount", "Currency");

        WriteMovementRow(sheet, 1, dateStyle, new DateTime(2026, 3, 1), "Salary", 2500.00);
        WriteMovementRow(sheet, 2, dateStyle, new DateTime(2026, 3, 2), "Groceries", -82.45);
        WriteMovementRow(sheet, 3, dateStyle, new DateTime(2026, 3, 3), "Coffee at the bar", -1.20);

        // Blank row: Analyze must skip it rather than emit a draft or an error.
        sheet.CreateRow(4);

        WriteMovementRow(sheet, 5, dateStyle, new DateTime(2026, 3, 5), "Rent", -750.00);
        WriteMovementRow(sheet, 6, dateStyle, new DateTime(2026, 3, 6), "Insurance refund", 134.90);
        WriteMovementRow(sheet, 7, dateStyle, new DateTime(2026, 3, 7), "Gym membership", -45.00);
    }

    /// <summary>
    /// Header is neither the first row nor the first column: three rows of preamble, then
    /// headers starting on column B so the reported indexes must start at 2.
    /// </summary>
    private static void BuildStatementWithPreamble(IWorkbook workbook)
    {
        var sheet = workbook.CreateSheet("Statement");
        var dateStyle = CreateDateStyle(workbook);

        // A single string is not enough to qualify as a header row.
        WriteStringRow(sheet, rowIndex: 0, "Account statement - Example Bank");
        sheet.CreateRow(1);

        // Numeric cells never qualify, no matter how many are consecutive.
        var numericPreamble = sheet.CreateRow(2);
        numericPreamble.CreateCell(0).SetCellValue(2026d);
        numericPreamble.CreateCell(1).SetCellValue(3d);
        numericPreamble.CreateCell(2).SetCellValue(31d);

        WriteStringRow(sheet, rowIndex: 3, startColumn: 1, "Value date", "Transaction description", "Amount", "Currency");

        WriteMovementRow(sheet, 4, dateStyle, new DateTime(2026, 4, 10), "Incoming transfer", 320.00, startColumn: 1);
        WriteMovementRow(sheet, 5, dateStyle, new DateTime(2026, 4, 11), "Bill payment", -64.30, startColumn: 1);
        WriteMovementRow(sheet, 6, dateStyle, new DateTime(2026, 4, 12), "Phone top-up", -10.00, startColumn: 1);
    }

    /// <summary>
    /// Every cell is text, exercising ParseAmount / ParseDate and the category fallback.
    /// </summary>
    private static void BuildMessyFormats(IWorkbook workbook)
    {
        var sheet = workbook.CreateSheet("Transactions");

        WriteStringRow(sheet, rowIndex: 0, "Date", "Description", "Amount", "Category");

        // EU thousands separator, exact enum name.
        WriteStringRow(sheet, 1, "01/03/2026", "Salary transfer", "1.234,56", "Salary");
        // US thousands separator, enum name in the wrong case.
        WriteStringRow(sheet, 2, "2026-03-02", "Expense refund", "1,234.56", "food");
        // Currency symbol, two-digit year, unknown category.
        WriteStringRow(sheet, 3, "1/3/26", "Dinner out", "\u20ac -45,90", "NotACategory");
        // Integer amount, no decimals.
        WriteStringRow(sheet, 4, "04/03/2026", "Fuel", "-12", "Transport");
    }

    /// <summary>
    /// Mixes parsable and unparsable rows so Preview must return drafts and errors together.
    /// </summary>
    private static void BuildInvalidRows(IWorkbook workbook)
    {
        var sheet = workbook.CreateSheet("Transactions");

        WriteStringRow(sheet, rowIndex: 0, "Date", "Description", "Amount");

        WriteStringRow(sheet, 1, "01/03/2026", "Valid one", "-10,00");
        WriteStringRow(sheet, 2, "not-a-date", "Unreadable date", "-20,00");
        WriteStringRow(sheet, 3, "03/03/2026", "Unreadable amount", "abc");
        WriteStringRow(sheet, 4, "04/03/2026", "Valid two", "-30,00");
        WriteStringRow(sheet, 5, "05/03/2026", "Missing amount", "");
    }

    /// <summary>Numbers only: no row ever reaches three consecutive text cells.</summary>
    private static void BuildWithoutHeader(IWorkbook workbook)
    {
        var sheet = workbook.CreateSheet("Numbers");

        for (var rowIndex = 0; rowIndex < 3; rowIndex++)
        {
            var row = sheet.CreateRow(rowIndex);
            for (var column = 0; column < 4; column++)
            {
                row.CreateCell(column).SetCellValue((rowIndex + 1) * 10d + column);
            }
        }
    }

    private static void WriteStandardCsv(string path)
    {
        File.WriteAllText(path,
            """
            Date,Details,Amount,Currency
            01/03/2026,Salary,2500,EUR
            02/03/2026,Groceries,-82.45,EUR
            03/03/2026,"Coffee at the bar",-1.20,EUR

            05/03/2026,Rent,-750,EUR
            06/03/2026,Insurance refund,134.90,EUR
            07/03/2026,Gym membership,-45,EUR
            """);
    }

    private static void Write(string path, Action<IWorkbook> build)
    {
        // ExcelDataReader detects the format from the file bytes, so .xlsm is written as OpenXML
        // and only the extension differs: the API validates the extension, the reader the content.
        IWorkbook workbook = Path.GetExtension(path) == ".xls"
            ? new HSSFWorkbook()
            : new XSSFWorkbook();

        build(workbook);

        using var file = File.Create(path);
        workbook.Write(file, leaveOpen: true);
    }

    private static ICellStyle CreateDateStyle(IWorkbook workbook)
    {
        var style = workbook.CreateCellStyle();
        style.DataFormat = workbook.CreateDataFormat().GetFormat("dd/mm/yyyy");
        return style;
    }

    private static void WriteStringRow(ISheet sheet, int rowIndex, params string[] values)
    {
        WriteStringRow(sheet, rowIndex, startColumn: 0, values);
    }

    private static void WriteStringRow(ISheet sheet, int rowIndex, int startColumn, params string[] values)
    {
        var row = sheet.CreateRow(rowIndex);
        for (var i = 0; i < values.Length; i++)
        {
            row.CreateCell(startColumn + i).SetCellValue(values[i]);
        }
    }

    private static void WriteMovementRow(
        ISheet sheet,
        int rowIndex,
        ICellStyle dateStyle,
        DateTime date,
        string description,
        double amount,
        int startColumn = 0)
    {
        var row = sheet.CreateRow(rowIndex);

        // A date cell without a date DataFormat is read back as a bare OA serial number.
        var dateCell = row.CreateCell(startColumn);
        dateCell.SetCellValue(date);
        dateCell.CellStyle = dateStyle;

        row.CreateCell(startColumn + 1).SetCellValue(description);
        row.CreateCell(startColumn + 2).SetCellValue(amount);
        row.CreateCell(startColumn + 3).SetCellValue("EUR");
    }
}
