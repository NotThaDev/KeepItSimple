using KeepItSimple.Api.Models.Notifications;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// Setup the notification system for the application.
/// Here we are registering the settings, the channels and the background dispatcher that delivers queued notifications.
/// </summary>
public static class NotificationSetup
{
    private const string _notificationsSection = "Notifications";
    public static IServiceCollection AddKeepItSimpleNotifications(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<NotificationSettings>(configuration.GetSection(_notificationsSection));
        // Channels register here as singletons: services.AddSingleton<INotificationChannel, ...>().
        services.AddHostedService<NotificationDispatcher>();
        return services;
    }
}
