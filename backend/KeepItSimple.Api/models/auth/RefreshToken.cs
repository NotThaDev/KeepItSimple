using System.Security.Cryptography;
using System.Text;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models.Auth;

/// <summary>
/// One row per login session. The raw token only lives in the user's cookie; the database keeps its SHA-256 hash,
/// so a leaked database can't be used to refresh anyone's session.
/// </summary>
public class RefreshToken
{
    public const string CookieName = "kis_refresh";

    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    // Shared by every row of one login, across rotations: logout and replay end the session by this id.
    public Guid SessionId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    // Set only by rotation; an ended session (logout, password change, replay) deletes its rows instead.
    public DateTime? RevokedAt { get; set; }
    // Set when the token was rotated. Seeing a rotated token again means it was stolen and replayed.
    public string? ReplacedByHash { get; set; }

    public bool IsActive(DateTime now) => RevokedAt == null && ExpiresAt > now;

    private static readonly TimeSpan GracePeriod = TimeSpan.FromSeconds(10);

    // Rotated a moment ago: a parallel request (for example a prefetch) still holding this token, not a replay by a thief.
    public bool IsInGracePeriod(DateTime now) => ReplacedByHash != null && RevokedAt != null && now - RevokedAt.Value < GracePeriod;

    public static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public static Task<(string Token, DateTime ExpiresAt, Guid SessionId)> CreateAsync(string userId, TimeSpan lifetime)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var now = DateTime.UtcNow;
            await DeleteExpiredAsync(dbContext, userId, now);
            var (token, row) = NewRow(userId, Guid.NewGuid(), lifetime, now);
            dbContext.RefreshTokens.Add(row);
            await dbContext.SaveChangesAsync();
            return (token, row.ExpiresAt, row.SessionId);
        });
    }

    /// <summary>
    /// Swaps a valid token for a new one. Returns null when the token is unknown, expired, revoked or replayed.
    /// A replayed (already rotated) token revokes that session (other sessions of the user stay), unless it was rotated within the grace period.
    /// </summary>
    public static Task<(string UserId, string Token, DateTime ExpiresAt, Guid SessionId)?> RotateAsync(string token, TimeSpan lifetime)
    {
        var hash = Hash(token);
        return KeepItSimpleContext.Context.WithDbContextAsync<(string, string, DateTime, Guid)?>(async dbContext =>
        {
            var now = DateTime.UtcNow;
            var row = await dbContext.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash);
            if (row == null)
            {
                return null;
            }

            if (row.ReplacedByHash != null)
            {
                return await GraceRotateAsync(dbContext, row, lifetime, now);
            }

            if (!row.IsActive(now))
            {
                return null;
            }

            var (newToken, newRow) = NewRow(row.UserId, row.SessionId, lifetime, now);
            // One transaction: a parallel refresh blocks on the row lock and then sees both the revoke and the new row.
            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            var claimed = await dbContext.RefreshTokens
                .Where(t => t.Id == row.Id && t.RevokedAt == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(t => t.RevokedAt, now)
                    .SetProperty(t => t.ReplacedByHash, newRow.TokenHash));
            if (claimed == 0)
            {
                // Another request rotated it first: treat this one as a grace-period replay.
                await transaction.RollbackAsync();
                await dbContext.Entry(row).ReloadAsync();
                return await GraceRotateAsync(dbContext, row, lifetime, now);
            }

            // Here too, not only at login: an active user refreshes for weeks without logging in again.
            await DeleteExpiredAsync(dbContext, row.UserId, now);
            dbContext.RefreshTokens.Add(newRow);
            await dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            return (row.UserId, newToken, newRow.ExpiresAt, row.SessionId);
        });
    }

    // shortcut: each grace hit leaves one more active row for this session; they share the SessionId, expire on their own and never count as another session.
    private static async Task<(string, string, DateTime, Guid)?> GraceRotateAsync(KeepItSimpleDbContext dbContext, RefreshToken row, TimeSpan lifetime, DateTime now)
    {
        // The successor must still be active, so a replay can't revive a session ended by logout.
        var successorActive = await dbContext.RefreshTokens
            .AnyAsync(t => t.TokenHash == row.ReplacedByHash && t.RevokedAt == null && t.ExpiresAt > now);
        if (!row.IsInGracePeriod(now) || !successorActive)
        {
            // The session is compromised; the user's other sessions stay.
            await DeleteSessionAsync(dbContext, row.SessionId);
            return null;
        }

        var (token, newRow) = NewRow(row.UserId, row.SessionId, lifetime, now);
        dbContext.RefreshTokens.Add(newRow);
        await dbContext.SaveChangesAsync();
        return (row.UserId, token, newRow.ExpiresAt, row.SessionId);
    }

    public static Task<int> RevokeAsync(string token)
    {
        var hash = Hash(token);
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var sessionId = await dbContext.RefreshTokens
                .Where(t => t.TokenHash == hash)
                .Select(t => (Guid?)t.SessionId)
                .SingleOrDefaultAsync();
            return sessionId == null ? 0 : await DeleteSessionAsync(dbContext, sessionId.Value);
        });
    }

    // Read on every API request (AuthSetup), so it stays one indexed query.
    public static Task<bool> IsSessionActiveAsync(Guid sessionId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext => dbContext.RefreshTokens
            .AnyAsync(t => t.SessionId == sessionId && t.RevokedAt == null && t.ExpiresAt > DateTime.UtcNow));
    }

    // An ended session leaves no rows: a token of it is then unknown and gets a 401, like a revoked one did.
    private static Task<int> DeleteSessionAsync(KeepItSimpleDbContext dbContext, Guid sessionId)
    {
        return dbContext.RefreshTokens
            .Where(t => t.SessionId == sessionId)
            .ExecuteDeleteAsync();
    }

    public static Task<int> RevokeAllAsync(string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext => dbContext.RefreshTokens
            .Where(t => t.UserId == userId)
            .ExecuteDeleteAsync());
    }

    // Only expired rows: rotated ones that are still unexpired must stay, they are how a replayed stolen token gets caught.
    private static Task<int> DeleteExpiredAsync(KeepItSimpleDbContext dbContext, string userId, DateTime now)
    {
        return dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.ExpiresAt <= now)
            .ExecuteDeleteAsync();
    }

    private static (string Token, RefreshToken Row) NewRow(string userId, Guid sessionId, TimeSpan lifetime, DateTime now)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        return (token, new RefreshToken
        {
            UserId = userId,
            SessionId = sessionId,
            TokenHash = Hash(token),
            CreatedAt = now,
            ExpiresAt = now.Add(lifetime),
        });
    }
}
