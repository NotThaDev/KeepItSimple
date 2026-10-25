namespace KeepItSimple.Api.Dtos.Auth;

// LastUsedAt is the last refresh, so it lags real use by up to the access-token lifetime.
public record SessionResponse(Guid Id, string? UserAgent, DateTime CreatedAt, DateTime LastUsedAt, bool Current);
