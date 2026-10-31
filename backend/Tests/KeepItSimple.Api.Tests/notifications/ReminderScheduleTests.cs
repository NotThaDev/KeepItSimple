using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Notifications;

namespace KeepItSimple.Api.Tests.Notifications;

public class ReminderScheduleTests
{
    private static ImportReminderSetting Setting(
        ReminderFrequency frequency = ReminderFrequency.Daily,
        DayOfWeek? dayOfWeek = null,
        int? dayOfMonth = null,
        TimeOnly? time = null,
        string timeZone = "Europe/Rome") => new()
    {
        Enabled = true,
        Frequency = frequency,
        DayOfWeek = dayOfWeek,
        DayOfMonth = dayOfMonth,
        TimeOfDay = time ?? new TimeOnly(9, 0),
        TimeZone = timeZone,
    };

    [Fact]
    public void NextRunUtc_daily_before_time_returns_today()
    {
        var next = ReminderSchedule.NextRunUtc(Setting(), new DateTime(2026, 3, 10, 6, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 3, 10, 8, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRunUtc_daily_at_exact_time_returns_tomorrow()
    {
        var next = ReminderSchedule.NextRunUtc(Setting(), new DateTime(2026, 3, 10, 8, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 3, 11, 8, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRunUtc_weekly_returns_next_matching_weekday()
    {
        var next = ReminderSchedule.NextRunUtc(
            Setting(ReminderFrequency.Weekly, dayOfWeek: DayOfWeek.Monday),
            new DateTime(2026, 3, 10, 6, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 3, 16, 8, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRunUtc_monthly_rolls_to_next_month()
    {
        var next = ReminderSchedule.NextRunUtc(
            Setting(ReminderFrequency.Monthly, dayOfMonth: 5),
            new DateTime(2026, 3, 10, 6, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 4, 5, 7, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRunUtc_time_in_dst_gap_moves_forward_one_hour()
    {
        var next = ReminderSchedule.NextRunUtc(
            Setting(time: new TimeOnly(2, 30)),
            new DateTime(2026, 3, 28, 23, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 3, 29, 1, 30, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRunUtc_uses_the_user_time_zone()
    {
        var next = ReminderSchedule.NextRunUtc(
            Setting(timeZone: "America/New_York"),
            new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 6, 1, 13, 0, 0, DateTimeKind.Utc), next);
    }
}
