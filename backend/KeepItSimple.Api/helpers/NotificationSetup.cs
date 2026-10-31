using KeepItSimple.Api.BackgroundServices;
using KeepItSimple.Api.Models.Notifications.Channels;
using KeepItSimple.Api.Settings;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// Setup the notification system for the application.
/// Here we are registering the settings, the channels and the background dispatcher that delivers queued notifications.
/// </summary>
public static class NotificationSetup
{
    private const string _notificationsSection = "Notifications";
    private const string _emailSection = "Email";
    public static IServiceCollection AddKeepItSimpleNotifications(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<NotificationSettings>(configuration.GetSection(_notificationsSection));
        services.Configure<EmailSettings>(configuration.GetSection(_emailSection));
        // Channels are singletons; one registration per channel.
        services.AddSingleton<INotificationChannel, EmailChannel>();
        services.AddSingleton<INotificationChannel, InAppChannel>();
        services.AddHostedService<NotificationDispatcher>();
        return services;
    }
}
