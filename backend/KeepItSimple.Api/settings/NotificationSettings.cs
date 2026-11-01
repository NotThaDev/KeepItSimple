namespace KeepItSimple.Api.Settings;

public class NotificationSettings
{
    public int PollIntervalSeconds { get; set; } = 10;
    public int BatchSize { get; set; } = 20;
    public int MaxAttempts { get; set; } = 5;
    public int RetryBaseSeconds { get; set; } = 30;
    public int InAppRetentionDays { get; set; } = 30;
    public int ReminderPollSeconds { get; set; } = 60;
}
