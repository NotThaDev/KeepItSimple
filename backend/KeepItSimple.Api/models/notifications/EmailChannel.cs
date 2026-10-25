using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace KeepItSimple.Api.Models.Notifications;

public class EmailChannel(IOptions<EmailSettings> options) : INotificationChannel
{
    private static readonly byte[] Logo = ReadLogo();

    public NotificationChannelType Type => NotificationChannelType.Email;

    public async Task SendAsync(Notification notification, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.Host))
        {
            throw new InvalidOperationException("Email:Host is not configured.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(settings.FromName, settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(notification.Recipient));
        message.Subject = notification.Subject;
        var body = new BodyBuilder { HtmlBody = notification.Body };
        if (notification.Body.Contains($"cid:{EmailTemplates.LogoContentId}"))
        {
            // Inline, not a URL: there is no public site to host it yet, and Gmail blocks data: images.
            body.LinkedResources.Add("logo.png", Logo, ContentType.Parse("image/png")).ContentId = EmailTemplates.LogoContentId;
        }

        message.Body = body.ToMessageBody();

        using var client = new SmtpClient();
        // Let's Encrypt dropped OCSP, so revocation checks fail on macOS; the chain and host name are still validated.
        client.CheckCertificateRevocation = false;
        await client.ConnectAsync(settings.Host, settings.Port, settings.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable, cancellationToken);
        if (!string.IsNullOrEmpty(settings.Username))
        {
            await client.AuthenticateAsync(settings.Username, settings.Password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    // Embedded in the assembly, so it ships with the API whatever the working directory.
    private static byte[] ReadLogo()
    {
        using var stream = typeof(EmailChannel).Assembly.GetManifestResourceStream("logo.png")
            ?? throw new InvalidOperationException("Embedded resource logo.png is missing.");
        using var memory = new MemoryStream();
        stream.CopyTo(memory);
        return memory.ToArray();
    }
}
