namespace KeepItSimple.Api.Dtos.Auth;

public record ChangeExpiredPasswordRequest(string Username, string CurrentPassword, string NewPassword);
