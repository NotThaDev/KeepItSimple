using KeepItSimple.Api.Models.Notifications;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KeepItSimple.Api.Helpers;

// Polls the notifications table and hands each due row to its channel. Relies on KeepItSimpleContext.InitContext running before app.Run().
public class NotificationDispatcher(IEnumerable<INotificationChannel> channels, IOptions<NotificationSettings> options, ILogger<NotificationDispatcher> logger) : BackgroundService
{
    private readonly Dictionary<NotificationChannelType, INotificationChannel> _channels = channels.ToDictionary(c => c.Type);
    private readonly NotificationSettings _settings = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(_settings.PollIntervalSeconds));
            do
            {
                try
                {
                    await DispatchDueAsync(stoppingToken);
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    logger.LogError(ex, "Notification dispatch failed.");
                }
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private async Task DispatchDueAsync(CancellationToken ct)
    {
        foreach (var notification in await Notification.GetDueAsync(_settings.BatchSize))
        {
            if (!_channels.TryGetValue(notification.Channel, out var channel))
            {
                logger.LogWarning("No channel registered for notification {Id} ({Channel}).", notification.Id, notification.Channel);
                await Notification.MarkFailedAsync(notification.Id, $"No channel registered for {notification.Channel}.", maxAttempts: 1, TimeSpan.Zero);
                continue;
            }

            try
            {
                await channel.SendAsync(notification, ct);
                await Notification.MarkSentAsync(notification.Id);
            }
            // Only shutdown skips the bookkeeping; a channel's own timeout counts as a failed attempt.
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Sending notification {Id} over {Channel} failed.", notification.Id, notification.Channel);
                await Notification.MarkFailedAsync(notification.Id, ex.Message, _settings.MaxAttempts, TimeSpan.FromSeconds(_settings.RetryBaseSeconds));
            }
        }
    }
}
