using KeepItSimple.Api.Models.Auth;
using KeepItSimple.Api.Tests.Support;

namespace KeepItSimple.Api.Tests.Account;

public class ProfilePictureTests
{
    [Fact]
    public void DetectContentType_png_jpeg_webp_headers_are_recognized()
    {
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00];
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00];
        byte[] webp = [.. "RIFF"u8, 0x00, 0x00, 0x00, 0x00, .. "WEBP"u8, 0x00];

        Assert.Equal("image/png", ProfilePicture.DetectContentType(png));
        Assert.Equal("image/jpeg", ProfilePicture.DetectContentType(jpeg));
        Assert.Equal("image/webp", ProfilePicture.DetectContentType(webp));
    }

    [Fact]
    public void DetectContentType_other_bytes_return_null()
    {
        Assert.Null(ProfilePicture.DetectContentType("GIF89a"u8));
        Assert.Null(ProfilePicture.DetectContentType("hello world"u8));
        Assert.Null(ProfilePicture.DetectContentType(Array.Empty<byte>()));
        Assert.Null(ProfilePicture.DetectContentType("RIFF\0\0\0\0WAVE"u8));
    }

    [Fact]
    public async Task SaveAsync_then_GetAsync_returns_latest_and_DeleteAsync_removes_it()
    {
        var userId = TestApp.NewUserId();

        await ProfilePicture.SaveAsync(userId, "image/png", [1, 2, 3]);
        await ProfilePicture.SaveAsync(userId, "image/jpeg", [4, 5, 6]);

        var picture = await ProfilePicture.GetAsync(userId);
        Assert.NotNull(picture);
        Assert.Equal(new byte[] { 4, 5, 6 }, picture.Data);
        Assert.NotNull(await ProfilePicture.GetUpdatedAtAsync(userId));

        await ProfilePicture.DeleteAsync(userId);

        Assert.Null(await ProfilePicture.GetAsync(userId));
        Assert.Null(await ProfilePicture.GetUpdatedAtAsync(userId));
    }
}
