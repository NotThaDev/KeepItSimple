using System.Net;

namespace KeepItSimple.Api.Models.Notifications;

public static class EmailTemplates
{
    // Referenced as <img src="cid:logo">; EmailChannel embeds the image under this id.
    public const string LogoContentId = "logo";

    private const string Font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    public static (string Subject, string Body) EmailConfirmation(string userName, string link) =>
        ("Confirm your KeepItSimple account", Layout(
            preheader: "One click to finish creating your account.",
            title: "Confirm your email",
            userName,
            message: "Thanks for signing up! Confirm your email address to finish creating your KeepItSimple account.",
            buttonText: "Confirm email",
            link,
            footnote: "The link works for one day. If you did not create an account, you can ignore this email."));

    public static (string Subject, string Body) PasswordForgot(string userName, string link) =>
        ("Reset your KeepItSimple password", Layout(
            preheader: "Choose a new password for your account.",
            title: "Reset your password",
            userName,
            message: "We received a request to reset the password of your KeepItSimple account. Choose a new one with the button below.",
            buttonText: "Reset password",
            link,
            footnote: "The link works for one day and only once. If you did not ask for this, ignore this email: your password stays the same."));

    // Tables and inline styles: many email clients drop <style> blocks and modern CSS layout.
    private static string Layout(string preheader, string title, string userName, string message, string buttonText, string link, string footnote)
    {
        var name = WebUtility.HtmlEncode(userName);
        var href = WebUtility.HtmlEncode(link);
        return $"""
            <!doctype html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="color-scheme" content="light">
            <title>{title}</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f4f4f5;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preheader}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
            <tr><td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
            <tr><td align="center" style="padding-bottom:24px;">
            <img src="cid:{LogoContentId}" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border:0;">
            <span style="display:inline-block;vertical-align:middle;margin-left:8px;font-family:{Font};font-size:20px;font-weight:600;color:#18181b;">KeepItSimple</span>
            </td></tr>
            <tr><td style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;font-family:{Font};color:#18181b;">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:28px;font-weight:600;color:#18181b;">{title}</h1>
            <p style="margin:0 0 8px;font-size:15px;line-height:24px;">Hi {name},</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#3f3f46;">{message}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background-color:#4f46e5;">
            <a href="{href}" style="display:inline-block;padding:12px 24px;font-family:{Font};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">{buttonText}</a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#71717a;">If the button does not work, copy this link into your browser:<br><a href="{href}" style="color:#4f46e5;word-break:break-all;">{href}</a></p>
            </td></tr>
            <tr><td align="center" style="padding:24px 16px 0;font-family:{Font};font-size:12px;line-height:18px;color:#a1a1aa;">{footnote}<br>&copy; KeepItSimple</td></tr>
            </table>
            </td></tr>
            </table>
            </body>
            </html>
            """;
    }
}
