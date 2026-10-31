using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Notifications;
using KeepItSimple.Api.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Tests.Notifications;

public class ImportReminderSettingTests
{
    private static ImportReminderSetting Valid() => new() { Enabled = true, TimeZone = "Europe/Rome" };

    [Fact]
    public void Validate_weekly_without_day_throws()
    {
        var setting = Valid();
        setting.Frequency = ReminderFrequency.Weekly;

        Assert.Throws<ArgumentException>(() => setting.Validate());
    }

    [Fact]
    public void Validate_monthly_day_29_throws()
    {
        var setting = Valid();
        setting.Frequency = ReminderFrequency.Monthly;
        setting.DayOfMonth = 29;

        Assert.Throws<ArgumentException>(() => setting.Validate());
    }

    [Fact]
    public void Validate_unknown_time_zone_throws()
    {
        var setting = Valid();
        setting.TimeZone = "Mars/Base";

        Assert.Throws<ArgumentException>(() => setting.Validate());
    }

    [Fact]
    public void Validate_message_over_500_chars_throws()
    {
        var setting = Valid();
        setting.Message = new string('x', 501);

        Assert.Throws<ArgumentException>(() => setting.Validate());
    }

    [Fact]
    public async Task UpsertAsync_enabled_sets_next_run()
    {
        var saved = await ImportReminderSetting.UpsertAsync(Valid(), TestApp.NewUserId());

        Assert.NotNull(saved.NextRunAt);
        Assert.True(saved.NextRunAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task UpsertAsync_disabled_clears_next_run()
    {
        var userId = TestApp.NewUserId();
        await ImportReminderSetting.UpsertAsync(Valid(), userId);
        var disabled = Valid();
        disabled.Enabled = false;

        var saved = await ImportReminderSetting.UpsertAsync(disabled, userId);

        Assert.Null(saved.NextRunAt);
    }

    [Fact]
    public async Task UpsertAsync_twice_updates_same_row()
    {
        var userId = TestApp.NewUserId();
        await ImportReminderSetting.UpsertAsync(Valid(), userId);
        var changed = Valid();
        changed.SendEmail = true;

        await ImportReminderSetting.UpsertAsync(changed, userId);

        var count = await KeepItSimpleContext.Context.WithDbContextAsync(db =>
            db.ImportReminderSettings.CountAsync(s => s.UserId == userId));
        var stored = await ImportReminderSetting.GetAsync(userId);
        Assert.Equal(1, count);
        Assert.True(stored!.SendEmail);
    }

    [Fact]
    public void Normalize_clears_fields_of_other_frequencies()
    {
        var setting = Valid();
        setting.Frequency = ReminderFrequency.Weekly;
        setting.DayOfWeek = DayOfWeek.Monday;
        setting.DayOfMonth = 5;
        setting.Message = "   ";

        setting.Normalize();

        Assert.Equal(DayOfWeek.Monday, setting.DayOfWeek);
        Assert.Null(setting.DayOfMonth);
        Assert.Null(setting.Message);
    }
}
