using System.Text.Json.Serialization;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models.Reports;

/// <summary>
/// A generated Excel report. The file is stored, so a download always returns the same snapshot.
/// </summary>
public class Report
{
    public int Id { get; set; }
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReportPeriod Period { get; set; }
    public DateTime PeriodStart { get; set; }
    // Exclusive.
    public DateTime PeriodEnd { get; set; }
    public string Label { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    [JsonIgnore]
    public byte[] Data { get; set; } = [];

    public const int MaxPerUser = 50;

    // Never loads Data, so listing reports does not pull the file bytes.
    public static Task<List<Report>> GetAllAsync(string userId) =>
        KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
            dbContext.Reports.AsNoTracking()
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new Report
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Period = r.Period,
                    PeriodStart = r.PeriodStart,
                    PeriodEnd = r.PeriodEnd,
                    Label = r.Label,
                    CreatedAt = r.CreatedAt,
                    FileName = r.FileName,
                    SizeBytes = r.SizeBytes,
                })
                .ToListAsync());

    public static Task<Report?> GetFileAsync(int id, string userId) =>
        KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
            dbContext.Reports.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId));

    public static Task<int> CountAsync(string userId) =>
        KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
            dbContext.Reports.CountAsync(r => r.UserId == userId));

    public static Task<Report> SaveAsync(Report report, string userId) =>
        KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            report.Id = 0;
            report.UserId = userId;
            report.SizeBytes = report.Data.LongLength;
            dbContext.Reports.Add(report);
            await dbContext.SaveChangesAsync();
            report.Data = [];
            return report;
        });

    public static Task<bool> DeleteAsync(int id, string userId) =>
        KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            if (!await dbContext.Reports.AnyAsync(r => r.Id == id && r.UserId == userId))
            {
                return false;
            }

            // A key-only stub, so the file bytes are never loaded (ExecuteDelete is not supported by the test provider).
            dbContext.Reports.Remove(new Report { Id = id });
            await dbContext.SaveChangesAsync();
            return true;
        });

    public static async Task<Report> CreateAsync(ReportPeriod period, string userId, DateTime utcNow)
    {
        var range = ReportPeriodRange.Resolve(period, utcNow);
        var pockets = await Pocket.GetAllAsync(userId);
        // shortcut: loads every transaction of the user; filter to PreviousStart onward plus a summed tail if reports get slow.
        var transactions = await Transaction.GetAllAsync(userId);
        var data = ReportWorkbook.Render(ReportCalculator.Calculate(transactions, pockets, range, utcNow));
        return await SaveAsync(new Report { Period = period, PeriodStart = range.Start, PeriodEnd = range.End, Label = range.Label, CreatedAt = utcNow, FileName = $"KeepItSimple-{range.Label.Replace(' ', '-')}-{utcNow:yyyyMMdd-HHmm}.xlsx", Data = data }, userId);
    }
}

public enum ReportPeriod
{
    LastMonth,
    LastQuarter,
    LastYear,
}
