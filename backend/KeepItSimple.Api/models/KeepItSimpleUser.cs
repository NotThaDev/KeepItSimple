
// For now this will be a copy of the IdentityUser class. But later we will add the custom properties that we need.
// e.g NotificationPreferences, Theme, etc.
using Microsoft.AspNetCore.Identity;
namespace KeepItSimple.Api.Models;

public sealed class KeepItSimpleUser : IdentityUser;