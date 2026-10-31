using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Models.Notifications;

// The single entry point features call. It only queues: NotificationDispatcher sends on its next poll (Notifications:PollIntervalSeconds).
public static class NotificationManager
{
    public static Task EnqueueAsync(string? userId, NotificationChannelType channel, string recipient, string subject, string body)
    {
        if (!Enum.IsDefined(channel))
        {
            throw new ArgumentException($"Unknown notification channel {channel}.", nameof(channel));
        }

        if (string.IsNullOrWhiteSpace(recipient))
        {
            throw new ArgumentException("Recipient is required.", nameof(recipient));
        }

        return Notification.EnqueueAsync(new Notification
        {
            UserId = userId,
            Channel = channel,
            Recipient = recipient,
            Subject = subject,
            Body = body,
        });
    }

    public static Task EnqueueInAppAsync(string userId, string title, string body) =>
        EnqueueAsync(userId, NotificationChannelType.InApp, userId, title, body);

    public static Task EnqueueEmailConfirmationAsync(KeepItSimpleUser user, string confirmationLink) =>
        EnqueueEmailAsync(user, EmailTemplates.EmailConfirmation, confirmationLink);

    public static Task EnqueuePasswordForgotAsync(KeepItSimpleUser user, string resetLink) =>
        EnqueueEmailAsync(user, EmailTemplates.PasswordForgot, resetLink);

    private static Task EnqueueEmailAsync(KeepItSimpleUser user, Func<string, string, (string Subject, string Body)> template, string link)
    {
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new ArgumentException("User has no email address.", nameof(user));
        }

        var (subject, body) = template(user.UserName ?? user.Email, link);
        return EnqueueAsync(user.Id, NotificationChannelType.Email, user.Email, subject, body);
    }
}
