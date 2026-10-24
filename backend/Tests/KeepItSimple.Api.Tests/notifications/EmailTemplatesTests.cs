using KeepItSimple.Api.Models.Notifications;

namespace KeepItSimple.Api.Tests.Notifications;

public class EmailTemplatesTests
{
    [Fact]
    public void EmailConfirmation_contains_the_link()
    {
        var (_, body) = EmailTemplates.EmailConfirmation("tha", "https://x.test/confirm?a=1&b=2");

        // The ampersand is HTML-encoded inside the href.
        Assert.Contains("https://x.test/confirm?a=1&amp;b=2", body);
    }

    [Fact]
    public void EmailConfirmation_encodes_the_user_name()
    {
        var (_, body) = EmailTemplates.EmailConfirmation("<script>", "https://x.test/confirm");

        Assert.Contains("&lt;script&gt;", body);
        Assert.DoesNotContain("<script>", body);
    }

    [Fact]
    public void PasswordForgot_contains_the_link()
    {
        var (_, body) = EmailTemplates.PasswordForgot("tha", "https://x.test/reset?t=abc");

        Assert.Contains("https://x.test/reset?t=abc", body);
    }
}
