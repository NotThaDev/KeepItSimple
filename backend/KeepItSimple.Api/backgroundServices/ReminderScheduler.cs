using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Notifications;
using KeepItSimple.Api.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace KeepItSimple.Api.BackgroundServices;

// Queues the import reminder for each setting whose NextRunAt has passed. Relies on KeepItSimpleContext.InitContext running before app.Run().
public class ReminderScheduler(IOptions<NotificationSettings> options, IOptions<FrontendSettings> frontend, ILogger<ReminderScheduler> logger) : BackgroundService
{
    private readonly NotificationSettings _settings = options.Value;
    private readonly string _link = frontend.Value.BaseUrl.TrimEnd('/') + "/transactions";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(_settings.ReminderPollSeconds));
            do
            {
                try
                {
                    await RunDueAsync(stoppingToken);
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    logger.LogError(ex, "Import reminder scheduling failed.");
                }
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private async Task RunDueAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // shortcut: loads every due row at once, fine while due reminders per tick stay in the thousands; page by Id if that grows.
        var due = await ImportReminderSetting.GetDueAsync(now);
        foreach (var batch in due.Chunk(_settings.BatchSize))
        {
            var ids = batch.Select(s => s.UserId).ToList();
            var users = await KeepItSimpleContext.Context.WithDbContextAsync(db =>
                db.Users.AsNoTracking().Where(u => ids.Contains(u.Id)).ToListAsync());
            var byId = users.ToDictionary(u => u.Id);

            foreach (var setting in batch)
            {
                if (!byId.TryGetValue(setting.UserId, out var user))
                {
                    await ImportReminderSetting.SetNextRunAsync(setting.Id, null);
                    continue;
                }

                DateTime nextRun;
                try
                {
                    nextRun = ReminderSchedule.NextRunUtc(setting, now);
                }

                // A time zone the host no longer knows would stay due forever and block every row behind it.
                catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException or InvalidOperationException)
                {
                    logger.LogWarning(ex, "Import reminder {Id} has an unusable schedule; it is paused.", setting.Id);
                    await ImportReminderSetting.SetNextRunAsync(setting.Id, null);
                    continue;
                }

                // Advance first: a crash between the two skips one reminder instead of sending it twice.
                await ImportReminderSetting.SetNextRunAsync(setting.Id, nextRun);
                try
                {
                    await NotificationManager.EnqueueImportReminderAsync(user, setting, _link);
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    logger.LogWarning(ex, "Queuing import reminder {Id} failed.", setting.Id);
                }
            }
        }
    }
}
