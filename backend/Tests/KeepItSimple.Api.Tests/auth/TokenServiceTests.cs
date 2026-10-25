using KeepItSimple.Api.Models.Auth;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Settings;
using Microsoft.IdentityModel.JsonWebTokens;

namespace KeepItSimple.Api.Tests.Auth;

public class TokenServiceTests
{
    [Fact]
    public void CreateToken_puts_the_session_id_in_the_sid_claim()
    {
        var service = new TokenService(new JwtSettings
        {
            Key = "test-key-test-key-test-key-test-key-1234",
            Issuer = "test",
            Audience = "test",
            ExpiryMinutes = 5,
            RefreshExpiryDays = 1,
        });
        var sessionId = Guid.NewGuid();

        var (token, _) = service.CreateToken(new KeepItSimpleUser { Id = "u", Email = "u@example.test", UserName = "u" }, [], sessionId);

        var sid = new JsonWebTokenHandler().ReadJsonWebToken(token).GetClaim("sid").Value;
        Assert.Equal(sessionId.ToString(), sid);
    }
}
