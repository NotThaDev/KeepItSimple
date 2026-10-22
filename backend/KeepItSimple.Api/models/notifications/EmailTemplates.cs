using System.Net;

namespace KeepItSimple.Api.Models.Notifications;

public static class EmailTemplates
{
    public static (string Subject, string Body) EmailConfirmation(string userName, string link)
    {
        var name = WebUtility.HtmlEncode(userName);
        var href = WebUtility.HtmlEncode(link);
        return ("Confirm your KeepItSimple email", $"""
            <p>Hi {name},</p>
            <p>Confirm your email address to finish creating your KeepItSimple account.</p>
            <p><a href="{href}">Confirm email</a></p>
            <p>If you did not create an account, ignore this email.</p>
            """);
    }

    public static (string Subject, string Body) PasswordForgot(string userName, string link)
    {
        var name = WebUtility.HtmlEncode(userName);
        var href = WebUtility.HtmlEncode(link);
        return ("Reset your KeepItSimple password", $"""
            <p>Hi {name},</p>
            <p>We received a request to reset your password.</p>
            <p><a href="{href}">Reset password</a></p>
            <p>If you did not ask for this, ignore this email.</p>
            """);
    }
}
