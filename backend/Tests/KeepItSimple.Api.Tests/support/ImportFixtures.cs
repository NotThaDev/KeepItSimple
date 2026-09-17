using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Helpers;
using static KeepItSimple.Api.Helpers.TransactionImporter;

namespace KeepItSimple.Api.Tests.Support;

/// <summary>
/// Generates Excel/CSV fixtures into the test output directory and builds the
/// mappings the importer expects. Binaries are not committed; see
/// <see cref="ExcelFixtureGenerator"/>.
/// </summary>
public static class ImportFixtures
{
    public static string TransactionImportsDirectory { get; } = InitialiseTransactionImports();

    /// <summary>Theory source: the same statement in every extension the import accepts.</summary>
    public static TheoryData<string> StandardStatements =>
        [.. ExcelFixtureGenerator.StandardStatementFiles];

    public static Stream Open(string fileName)
    {
        var path = Path.Combine(TransactionImportsDirectory, fileName);
        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Missing generated fixture '{fileName}'.", path);
        }

        return File.OpenRead(path);
    }

    public static AnalyzeResponse Analyze(string fileName)
    {
        using var stream = Open(fileName);
        return TransactionImporter.Analyze(stream);
    }

    public static ColumnMapping Map(int columnIndex, MappableField targetField)
    {
        return new ColumnMapping
        {
            ColumnIndex = columnIndex,
            TargetField = targetField,
        };
    }

    /// <summary>
    /// Maps the given target fields onto consecutive columns starting at <paramref name="firstColumnIndex"/>.
    /// </summary>
    public static List<ColumnMapping> MapInOrder(
        int firstColumnIndex,
        params MappableField[] targetFields)
    {
        return [.. targetFields.Select((targetField, offset) => Map(firstColumnIndex + offset, targetField))];
    }

    /// <summary>
    /// Removes the generated fixtures after a successful test run. Left in place on failure
    /// so the files can be inspected under the test output directory.
    /// </summary>
    internal static void DeleteGeneratedFilesIfPresent()
    {
        var directory = Path.Combine(AppContext.BaseDirectory, "transactionImports");
        if (!Directory.Exists(directory))
        {
            return;
        }

        Directory.Delete(directory, recursive: true);
    }

    private static string InitialiseTransactionImports()
    {
        var directory = Path.Combine(AppContext.BaseDirectory, "transactionImports");
        ExcelFixtureGenerator.WriteAll(directory);
        return directory;
    }
}
