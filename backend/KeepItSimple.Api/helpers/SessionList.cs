using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Models.Auth;

namespace KeepItSimple.Api.Helpers;

public static class SessionList
{
    // Grace-period rotations can leave two active rows per session: the newest one is the session's last refresh.
    public static List<SessionResponse> Build(IEnumerable<RefreshToken> activeRows, Guid currentSessionId) =>
        activeRows
            .GroupBy(row => row.SessionId)
            .Select(group => group.MaxBy(row => row.CreatedAt)!)
            // Stored as UTC but read back as Unspecified, which would serialize without the Z.
            .Select(row => new SessionResponse(row.SessionId, row.UserAgent, DateTime.SpecifyKind(row.SessionCreatedAt, DateTimeKind.Utc), DateTime.SpecifyKind(row.CreatedAt, DateTimeKind.Utc), row.SessionId == currentSessionId))
            .OrderByDescending(session => session.LastUsedAt)
            .ToList();
}
