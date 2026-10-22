namespace KeepItSimple.Api.Models.Auth;

public class FrontendSettings
{
    // Where emailed links point; required, set Frontend__BaseUrl in production.
    public string BaseUrl { get; set; } = "";
}
