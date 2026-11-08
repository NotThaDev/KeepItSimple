using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using Field = KeepItSimple.Api.Helpers.TransactionImporter.MappableField;

namespace KeepItSimple.Api.Tests.ImportMappings;

public class FindBestMatchTests
{
    [Fact]
    public void FindBestMatch_exact_set_wins_over_newer_subset_match()
    {
        var exact = Build("exact", new DateTime(2025, 1, 1), ("Date", Field.Date), ("Amount", Field.Amount), ("Note", Field.Ignore));
        var subset = Build("subset", new DateTime(2026, 1, 1), ("Date", Field.Date), ("Amount", Field.Amount));

        var result = ImportMapping.FindBestMatch([subset, exact], new[] { "Date", "Amount", "Note" });

        Assert.Equal("exact", result!.Name);
    }

    [Fact]
    public void FindBestMatch_subset_matches_when_file_has_extra_columns()
    {
        var mapping = Build("subset", DateTime.UtcNow, ("Date", Field.Date), ("Amount", Field.Amount));

        var result = ImportMapping.FindBestMatch([mapping], new[] { "Date", "Amount", "Extra" });

        Assert.Equal("subset", result!.Name);
    }

    [Fact]
    public void FindBestMatch_ignores_case_and_surrounding_whitespace()
    {
        var mapping = Build("loose", DateTime.UtcNow, ("  DATE ", Field.Date), ("Amount", Field.Amount));

        var result = ImportMapping.FindBestMatch([mapping], new[] { "date", "AMOUNT" });

        Assert.Equal("loose", result!.Name);
    }

    [Fact]
    public void FindBestMatch_missing_mapped_header_returns_null()
    {
        var mapping = Build("m", DateTime.UtcNow, ("Date", Field.Date), ("Amount", Field.Amount), ("Description", Field.Description));

        var result = ImportMapping.FindBestMatch([mapping], new[] { "Date", "Amount" });

        Assert.Null(result);
    }

    [Fact]
    public void FindBestMatch_mapped_header_repeated_in_file_is_not_a_candidate()
    {
        var mapping = Build("m", DateTime.UtcNow, ("Date", Field.Date), ("Amount", Field.Amount));

        var result = ImportMapping.FindBestMatch([mapping], new[] { "Date", "Amount", "amount" });

        Assert.Null(result);
    }

    [Fact]
    public void FindBestMatch_tie_is_broken_by_later_UpdatedAt()
    {
        var older = Build("older", new DateTime(2025, 1, 1), ("Date", Field.Date), ("Amount", Field.Amount));
        var newer = Build("newer", new DateTime(2026, 1, 1), ("Date", Field.Date), ("Amount", Field.Amount));

        var result = ImportMapping.FindBestMatch([older, newer], new[] { "Date", "Amount" });

        Assert.Equal("newer", result!.Name);
    }

    [Fact]
    public void FindBestMatch_ignore_only_header_missing_from_file_still_matches()
    {
        var mapping = Build("with ignore", DateTime.UtcNow, ("Date", Field.Date), ("Amount", Field.Amount), ("Note", Field.Ignore));

        var result = ImportMapping.FindBestMatch([mapping], new[] { "Date", "Amount" });

        Assert.Equal("with ignore", result!.Name);
    }

    private static ImportMapping Build(string name, DateTime updatedAt, params (string Header, Field Target)[] columns) => new()
    {
        Name = name,
        UpdatedAt = updatedAt,
        Columns = columns.Select(column => new ImportMappingColumn { Header = column.Header, TargetField = column.Target }).ToList(),
    };
}
