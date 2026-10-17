using KeepItSimple.Api.Models.Auth;

namespace KeepItSimple.Api.Tests.Auth;

public class RefreshTokenTests
{
    private static readonly DateTime Now = new(2026, 10, 17, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Hash_same_token_gives_same_hash_and_never_the_token()
    {
        var hash = RefreshToken.Hash("abc");

        Assert.Equal(hash, RefreshToken.Hash("abc"));
        Assert.NotEqual(hash, RefreshToken.Hash("abd"));
        Assert.NotEqual("abc", hash);
    }

    [Fact]
    public void IsActive_only_when_not_revoked_and_not_expired()
    {
        Assert.True(new RefreshToken { ExpiresAt = Now.AddDays(1) }.IsActive(Now));
        Assert.False(new RefreshToken { ExpiresAt = Now }.IsActive(Now));
        Assert.False(new RefreshToken { ExpiresAt = Now.AddDays(1), RevokedAt = Now.AddHours(-1) }.IsActive(Now));
    }

    [Fact]
    public void IsInGracePeriod_only_shortly_after_a_rotation()
    {
        Assert.True(new RefreshToken { RevokedAt = Now.AddSeconds(-5), ReplacedByHash = "next" }.IsInGracePeriod(Now));
        Assert.False(new RefreshToken { RevokedAt = Now.AddSeconds(-15), ReplacedByHash = "next" }.IsInGracePeriod(Now));
        // Logged out (revoked without a successor) never qualifies.
        Assert.False(new RefreshToken { RevokedAt = Now.AddSeconds(-1) }.IsInGracePeriod(Now));
        Assert.False(new RefreshToken { ExpiresAt = Now.AddDays(1) }.IsInGracePeriod(Now));
    }
}
