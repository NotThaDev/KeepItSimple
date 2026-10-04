namespace KeepItSimple.Api.Dtos.Auth;

public record LoginRequest(string Password, string? Email = null, string? Username = null);