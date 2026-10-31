using KeepItSimple.Api.Models.Notifications;

namespace KeepItSimple.Api.Helpers;

public static class ReminderSchedule
{
    // Returns the first reminder time strictly after afterUtc, computed in the user's time zone and returned as UTC.
    // Counting from afterUtc rather than the old NextRunAt means missed runs collapse into one instead of piling up.
    // Ambiguous local times (clocks going back) use the standard offset, which is ConvertTimeToUtc's default.
    public static DateTime NextRunUtc(ImportReminderSetting setting, DateTime afterUtc)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(setting.TimeZone);
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(afterUtc, DateTimeKind.Utc), tz);
        // Start from the user's local date: near midnight it can differ from the UTC date.
        var startDate = DateOnly.FromDateTime(localNow);
        // Monthly days are capped at 28, so a match comes within ~31 days; 62 is a safety margin, not a real limit.
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
            // Today's slot may already be past; keep looking.
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
