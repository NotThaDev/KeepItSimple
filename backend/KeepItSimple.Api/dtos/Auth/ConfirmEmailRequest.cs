namespace KeepItSimple.Api.Dtos.Auth;

public record ConfirmEmailRequest(string UserId, string Token);
