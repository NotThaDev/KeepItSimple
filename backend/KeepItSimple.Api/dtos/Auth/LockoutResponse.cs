namespace KeepItSimple.Api.Dtos.Auth;

// Seconds instead of an end timestamp, so the client countdown doesn't depend on its clock matching the server's.
public record LockoutResponse(int RetryAfterSeconds);
