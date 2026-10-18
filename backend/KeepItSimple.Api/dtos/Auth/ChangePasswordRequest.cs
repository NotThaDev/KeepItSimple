namespace KeepItSimple.Api.Dtos.Auth;

public record ChangePasswordRequest(string Username, string CurrentPassword, string NewPassword);
