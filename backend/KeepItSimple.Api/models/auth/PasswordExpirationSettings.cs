namespace KeepItSimple.Api.Models.Auth;

public class PasswordExpirationSettings
{
    public int ExpirationDays { get; set; } = 182; // 0 turns expiration off
}
