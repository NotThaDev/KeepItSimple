using System.Reflection;
using KeepItSimple.Api.Helpers;

namespace KeepItSimple.Api.Tests.Support;

/// <summary>
/// Locates the committed Excel fixtures and builds the mappings the import helper expects.
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
            throw new FileNotFoundException(
                $"Missing fixture '{fileName}'. Regenerate it with ExcelFixtureGeneratorRunner.", path);
        }

        return File.OpenRead(path);
    }

    public static TransactionImportHelper.AnalyzeResponse Analyze(string fileName)
    {
        using var stream = Open(fileName);
        return TransactionImportHelper.Analyze(stream);
    }

    public static TransactionImportHelper.ColumnMapping Map(int columnIndex, string targetField)
    {
        return new TransactionImportHelper.ColumnMapping
        {
            ColumnIndex = columnIndex,
            TargetField = targetField,
        };
    }

    /// <summary>
    /// Maps the given target fields onto consecutive columns starting at <paramref name="firstColumnIndex"/>.
    /// </summary>
    public static List<TransactionImportHelper.ColumnMapping> MapInOrder(
        int firstColumnIndex,
        params string[] targetFields)
    {
        return targetFields
            .Select((targetField, offset) => Map(firstColumnIndex + offset, targetField))
            .ToList();
    }

    /// <summary>
    /// Rewriting the binaries here, rather than from a test, guarantees they land on disk before
    /// any test reads them, whatever order xUnit picks:
    /// REGENERATE_IMPORT_FIXTURES=1 dotnet test
    /// </summary>
    private static string InitialiseTransactionImports()
    {
        var directory = Path.Combine(ResolveTestDataRoot(), "transactionImports");

        if (Environment.GetEnvironmentVariable("REGENERATE_IMPORT_FIXTURES") == "1")
        {
            ExcelFixtureGenerator.WriteAll(directory);
        }

        return directory;
    }

    /// <summary>
    /// The tests/data folder is baked in at build time by the TestDataRoot assembly metadata,
    /// so fixtures are read from, and regenerated into, the same place.
    /// </summary>
    private static string ResolveTestDataRoot()
    {
        var root = typeof(ImportFixtures).Assembly
            .GetCustomAttributes<AssemblyMetadataAttribute>()
            .FirstOrDefault(attribute => attribute.Key == "TestDataRoot")
            ?.Value;

        if (string.IsNullOrWhiteSpace(root))
        {
            throw new InvalidOperationException(
                "TestDataRoot assembly metadata is missing; check KeepItSimple.Api.Tests.csproj.");
        }

        return root;
    }
}
