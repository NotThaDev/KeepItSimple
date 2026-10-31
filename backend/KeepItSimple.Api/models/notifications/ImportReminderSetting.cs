using System.Text.Json.Serialization;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models.Notifications;

public enum ReminderFrequency
{
    Daily = 1,
    Weekly = 2,
    Monthly = 3,
}

public class ImportReminderSetting
{
    public const int MessageMaxLength = 500;

    [JsonIgnore]
    public int Id { get; set; }
    [JsonIgnore]
    public string UserId { get; set; } = "";
    public bool Enabled { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReminderFrequency Frequency { get; set; } = ReminderFrequency.Daily;
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public DayOfWeek? DayOfWeek { get; set; }
    public int? DayOfMonth { get; set; }
    public TimeOnly TimeOfDay { get; set; } = new(9, 0);
    public string TimeZone { get; set; } = "UTC";
    public bool SendEmail { get; set; }
    public string? Message { get; set; }
    // UTC. Set by the server only; the scheduler reads it.
    [JsonIgnore]
    public DateTime? NextRunAt { get; set; }

    public void Normalize()
    {
        Message = string.IsNullOrWhiteSpace(Message) ? null : Message.Trim();
        TimeZone = (TimeZone ?? "").Trim();
        if (Frequency != ReminderFrequency.Weekly)
        {
            DayOfWeek = null;
        }
        if (Frequency != ReminderFrequency.Monthly)
        {
            DayOfMonth = null;
        }
    }

    public void Validate()
    {
        if (!Enum.IsDefined(Frequency))
        {
            throw new ArgumentException("Unknown reminder frequency.", nameof(Frequency));
        }
        if (Frequency == ReminderFrequency.Weekly && DayOfWeek == null)
        {
            throw new ArgumentException("Pick a weekday for a weekly reminder.", nameof(DayOfWeek));
        }
        if (Frequency == ReminderFrequency.Monthly && (DayOfMonth is null or < 1 or > 28))
        {
            throw new ArgumentException("Pick a day between 1 and 28 for a monthly reminder.", nameof(DayOfMonth));
        }
        if (!TimeZoneInfo.TryFindSystemTimeZoneById(TimeZone, out _))
        {
            throw new ArgumentException("Unknown time zone.", nameof(TimeZone));
        }
        if (Message?.Length > MessageMaxLength)
        {
            throw new ArgumentException($"Message must be {MessageMaxLength} characters or fewer.", nameof(Message));
        }
    }

    public static Task<ImportReminderSetting?> GetAsync(string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
            dbContext.ImportReminderSettings.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId));
    }

    public static Task<ImportReminderSetting> UpsertAsync(ImportReminderSetting incoming, string userId)
    {
        incoming.Normalize();
        incoming.Validate();
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var row = await dbContext.ImportReminderSettings.FirstOrDefaultAsync(s => s.UserId == userId);
            if (row == null)
            {
                row = new ImportReminderSetting { UserId = userId };
                dbContext.ImportReminderSettings.Add(row);
            }

            row.Enabled = incoming.Enabled;
            row.Frequency = incoming.Frequency;
            row.DayOfWeek = incoming.DayOfWeek;
            row.DayOfMonth = incoming.DayOfMonth;
            row.TimeOfDay = incoming.TimeOfDay;
            row.TimeZone = incoming.TimeZone;
            row.SendEmail = incoming.SendEmail;
            row.Message = incoming.Message;
            row.NextRunAt = row.Enabled ? ReminderSchedule.NextRunUtc(row, DateTime.UtcNow) : null;

            await dbContext.SaveChangesAsync();
            return row;
        });
    }

    public static Task<List<ImportReminderSetting>> GetDueAsync(DateTime nowUtc)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
            dbContext.ImportReminderSettings.AsNoTracking()
                .Where(s => s.Enabled && s.NextRunAt != null && s.NextRunAt <= nowUtc)
                .OrderBy(s => s.NextRunAt)
                .ToListAsync());
    }

    public static Task SetNextRunAsync(int id, DateTime? nextRunUtc)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var row = await dbContext.ImportReminderSettings.FirstOrDefaultAsync(s => s.Id == id);
            if (row != null)
            {
                row.NextRunAt = nextRunUtc;
                await dbContext.SaveChangesAsync();
            }
            return 0;
        });
    }
}
