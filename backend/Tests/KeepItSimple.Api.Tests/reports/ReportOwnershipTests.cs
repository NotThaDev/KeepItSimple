using KeepItSimple.Api.Models.Reports;
using KeepItSimple.Api.Tests.Support;

namespace KeepItSimple.Api.Tests.Reports;

/// <summary>
/// Each user only lists, downloads and deletes their own reports.
/// </summary>
public class ReportOwnershipTests
{
    [Fact]
    public async Task Stranger_cannot_list_download_or_delete_another_users_report()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var saved = await Report.SaveAsync(NewReport(), owner);

        Assert.Empty(await Report.GetAllAsync(stranger));
        Assert.Null(await Report.GetFileAsync(saved.Id, stranger));
        Assert.False(await Report.DeleteAsync(saved.Id, stranger));
    }

    [Fact]
    public async Task Owner_lists_without_bytes_downloads_file_and_deletes()
    {
        var owner = TestApp.NewUserId();
        var saved = await Report.SaveAsync(NewReport(), owner);

        var list = await Report.GetAllAsync(owner);
        Assert.Single(list);
        Assert.Empty(list[0].Data);
        Assert.Equal(3, list[0].SizeBytes);

        var file = await Report.GetFileAsync(saved.Id, owner);
        Assert.NotNull(file);
        Assert.Equal(3, file.Data.Length);

        Assert.True(await Report.DeleteAsync(saved.Id, owner));
        Assert.Null(await Report.GetFileAsync(saved.Id, owner));
    }

    private static Report NewReport() => new()
    {
        Period = ReportPeriod.LastMonth,
        PeriodStart = new DateTime(2025, 12, 1, 0, 0, 0, DateTimeKind.Utc),
        PeriodEnd = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        Label = "December 2025",
        CreatedAt = DateTime.UtcNow,
        FileName = "report.xlsx",
        Data = [1, 2, 3],
    };
}
