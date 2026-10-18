using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Tests.Auth;

public class PasswordExpirationTests
{
    private static readonly DateTime Now = new(2026, 10, 18, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Expiration_is_disabled_when_days_is_null_or_zero()
    {
        var user = new KeepItSimpleUser { PasswordChangedAt = Now.AddYears(-5) };

        Assert.False(user.IsPasswordExpired(null, Now));
        Assert.False(user.IsPasswordExpired(0, Now));
    }

    [Fact]
    public void Password_is_not_expired_one_day_before_the_limit()
    {
        var user = new KeepItSimpleUser { PasswordChangedAt = Now.AddDays(-181) };

        Assert.False(user.IsPasswordExpired(182, Now));
    }

    [Fact]
    public void Password_is_expired_on_the_limit_day()
    {
        var user = new KeepItSimpleUser { PasswordChangedAt = Now.AddDays(-182) };

        Assert.True(user.IsPasswordExpired(182, Now));
    }
}
