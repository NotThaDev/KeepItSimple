using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace KeepItSimple.Api.Models.Auth;

public class KeepItSimpleUserManager(
    IUserStore<KeepItSimpleUser> store,
    IOptions<IdentityOptions> optionsAccessor,
    IPasswordHasher<KeepItSimpleUser> passwordHasher,
    IEnumerable<IUserValidator<KeepItSimpleUser>> userValidators,
    IEnumerable<IPasswordValidator<KeepItSimpleUser>> passwordValidators,
    ILookupNormalizer keyNormalizer,
    IdentityErrorDescriber errors,
    IServiceProvider services,
    ILogger<UserManager<KeepItSimpleUser>> logger,
    IOptions<PasswordExpirationSettings> expirationSettings)
    : UserManager<KeepItSimpleUser>(store, optionsAccessor, passwordHasher, userValidators, passwordValidators, keyNormalizer, errors, services, logger)
{
    public bool IsPasswordExpired(KeepItSimpleUser user) =>
        user.IsPasswordExpired(expirationSettings.Value.ExpirationDays, DateTime.UtcNow);

    public override Task<IdentityResult> ChangePasswordAsync(KeepItSimpleUser user, string currentPassword, string newPassword) =>
        RestartingExpirationClock(user, () => base.ChangePasswordAsync(user, currentPassword, newPassword));

    public override Task<IdentityResult> ResetPasswordAsync(KeepItSimpleUser user, string token, string newPassword) =>
        RestartingExpirationClock(user, () => base.ResetPasswordAsync(user, token, newPassword));

    // Set before the update, so the password and its date are saved in one write.
    private static async Task<IdentityResult> RestartingExpirationClock(KeepItSimpleUser user, Func<Task<IdentityResult>> update)
    {
        var previous = user.PasswordChangedAt;
        user.PasswordChangedAt = DateTime.UtcNow;
        var succeeded = false;
        try
        {
            var result = await update();
            succeeded = result.Succeeded;
            return result;
        }
        finally
        {
            if (!succeeded)
            {
                user.PasswordChangedAt = previous;
            }
        }
    }
}
