using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Auth;

namespace KeepItSimple.Api.Tests.Auth;

public class SessionListTests
{
    private static readonly DateTime Start = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static RefreshToken Row(Guid session, int hours, string agent) => new()
    {
        SessionId = session,
        UserAgent = agent,
        SessionCreatedAt = Start,
        CreatedAt = Start.AddHours(hours),
    };

    [Fact]
    public void Build_keeps_newest_row_per_session_and_marks_current()
    {
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();

        var result = SessionList.Build([Row(a, 1, "old"), Row(a, 3, "new"), Row(b, 2, "other")], a);

        Assert.Equal(2, result.Count);
        var first = result.Single(s => s.Id == a);
        Assert.True(first.Current);
        Assert.Equal(Start.AddHours(3), first.LastUsedAt);
        Assert.Equal(Start, first.CreatedAt);
        Assert.Equal(DateTimeKind.Utc, first.LastUsedAt.Kind);
        Assert.False(result.Single(s => s.Id == b).Current);
    }

    [Fact]
    public void Build_orders_by_last_used_descending()
    {
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        var c = Guid.NewGuid();

        var result = SessionList.Build([Row(a, 1, "a"), Row(b, 5, "b"), Row(c, 3, "c")], a);

        Assert.Equal([b, c, a], result.Select(s => s.Id));
    }
}
