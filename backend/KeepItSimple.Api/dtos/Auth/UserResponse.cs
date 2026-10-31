namespace KeepItSimple.Api.Dtos.Auth;

// PictureVersion changes whenever the picture does, so the client can use it to bust the image cache. Null: no picture.
public record UserResponse(string Id, string? UserName, string? Email, long? PictureVersion);
