namespace KeepItSimple.Api.Dtos.Auth;

public record ResetPasswordRequest(string UserId, string Token, string NewPassword);
