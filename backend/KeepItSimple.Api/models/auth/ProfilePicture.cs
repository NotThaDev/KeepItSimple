using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models.Auth;

/// <summary>
/// A user's avatar. Its own table, so loading the user never loads the image bytes.
/// </summary>
public class ProfilePicture
{
    public const int MaxBytes = 1024 * 1024;

    public string UserId { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] Data { get; set; } = [];
    public DateTime UpdatedAt { get; set; }

    // The client's Content-Type is not trusted: the type comes from the file's first bytes.
    public static string? DetectContentType(ReadOnlySpan<byte> data)
    {
        if (data.StartsWith((byte[])[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return "image/png";
        if (data.StartsWith((byte[])[0xFF, 0xD8, 0xFF])) return "image/jpeg";
        // RIFF....WEBP
        if (data.Length >= 12 && data[..4].SequenceEqual("RIFF"u8) && data[8..12].SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }

    public static Task<ProfilePicture?> GetAsync(string userId) =>
        KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
            dbContext.ProfilePictures.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId));

    // Null when the user has no picture; never loads the bytes.
    public static Task<DateTime?> GetUpdatedAtAsync(string userId) =>
        KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
            dbContext.ProfilePictures.Where(p => p.UserId == userId).Select(p => (DateTime?)p.UpdatedAt).FirstOrDefaultAsync());

    public static async Task SaveAsync(string userId, string contentType, byte[] data)
    {
        await KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var picture = await dbContext.ProfilePictures.FirstOrDefaultAsync(p => p.UserId == userId);
            if (picture == null)
            {
                picture = new ProfilePicture { UserId = userId };
                dbContext.ProfilePictures.Add(picture);
            }
            picture.ContentType = contentType;
            picture.Data = data;
            picture.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
            return true;
        });
    }

    public static async Task DeleteAsync(string userId)
    {
        await KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var picture = await dbContext.ProfilePictures.FirstOrDefaultAsync(p => p.UserId == userId);
            if (picture != null)
            {
                dbContext.ProfilePictures.Remove(picture);
                await dbContext.SaveChangesAsync();
            }
            return true;
        });
    }
}
