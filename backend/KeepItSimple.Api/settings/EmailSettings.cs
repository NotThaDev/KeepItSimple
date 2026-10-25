namespace KeepItSimple.Api.Settings;

// Secrets come from environment variables (Email__Password, ...) or user-secrets, never from committed files.
public class EmailSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = false;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromAddress { get; set; } = "no-reply@keepitsimple.local";
    public string FromName { get; set; } = "KeepItSimple";
}
