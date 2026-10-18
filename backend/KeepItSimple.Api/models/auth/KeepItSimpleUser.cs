using Microsoft.AspNetCore.Identity;
namespace KeepItSimple.Api.Models;

public sealed class KeepItSimpleUser : IdentityUser
{
    // Initialized here so every way of creating a user starts a fresh expiration period.
    public DateTime PasswordChangedAt { get; set; } = DateTime.UtcNow;

    // Null or 0 days turns expiration off.
    public bool IsPasswordExpired(int? expirationDays, DateTime now) =>
        expirationDays > 0 && now >= PasswordChangedAt.AddDays(expirationDays.Value);
}
