using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Models.Notifications;

// The single entry point features call: it only queues; NotificationDispatcher delivers in the background.
public static class NotificationManager
{
    public static Task SendAsync(string? userId, NotificationChannelType channel, string recipient, string subject, string body)
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

    public static Task SendEmailConfirmationAsync(KeepItSimpleUser user, string confirmationLink) =>
        SendEmailAsync(user, EmailTemplates.EmailConfirmation, confirmationLink);

    public static Task SendPasswordForgotAsync(KeepItSimpleUser user, string resetLink) =>
        SendEmailAsync(user, EmailTemplates.PasswordForgot, resetLink);

    private static Task SendEmailAsync(KeepItSimpleUser user, Func<string, string, (string Subject, string Body)> template, string link)
    {
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new ArgumentException("User has no email address.", nameof(user));
        }

        var (subject, body) = template(user.UserName ?? user.Email, link);
        return SendAsync(user.Id, NotificationChannelType.Email, user.Email, subject, body);
    }
}
