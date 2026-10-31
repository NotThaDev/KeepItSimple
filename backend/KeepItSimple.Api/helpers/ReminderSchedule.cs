using KeepItSimple.Api.Models.Notifications;

namespace KeepItSimple.Api.Helpers;

public static class ReminderSchedule
{
    // Ambiguous local times (clocks going back) use the standard offset, which is ConvertTimeToUtc's default.
    public static DateTime NextRunUtc(ImportReminderSetting setting, DateTime afterUtc)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(setting.TimeZone);
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(afterUtc, DateTimeKind.Utc), tz);
        var startDate = DateOnly.FromDateTime(localNow);
        for (var offset = 0; offset <= 62; offset++)
        {
            var date = startDate.AddDays(offset);
            if (!Matches(setting, date))
            {
                continue;
            }

            var local = DateTime.SpecifyKind(date.ToDateTime(setting.TimeOfDay), DateTimeKind.Unspecified);
            // Clocks jumped forward over this time: run an hour later.
            if (tz.IsInvalidTime(local))
            {
                local = local.AddHours(1);
            }

            var utc = TimeZoneInfo.ConvertTimeToUtc(local, tz);
            if (utc > afterUtc)
            {
                return utc;
            }
        }

        throw new InvalidOperationException("No reminder date found.");
    }

    private static bool Matches(ImportReminderSetting setting, DateOnly date) => setting.Frequency switch
    {
        ReminderFrequency.Weekly => date.DayOfWeek == setting.DayOfWeek,
        ReminderFrequency.Monthly => date.Day == setting.DayOfMonth,
        _ => true,
    };
}
