using KeepItSimple.Api.Settings;
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

    // Set before base, so the password and its date are saved in one write.
    public override async Task<IdentityResult> ChangePasswordAsync(KeepItSimpleUser user, string currentPassword, string newPassword)
    {
        var previous = user.PasswordChangedAt;
        user.PasswordChangedAt = DateTime.UtcNow;
        var succeeded = false;
        try
        {
            var result = await base.ChangePasswordAsync(user, currentPassword, newPassword);
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
