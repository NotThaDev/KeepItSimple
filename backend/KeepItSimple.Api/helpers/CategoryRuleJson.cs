using System.Text.Json;
using System.Text.Json.Serialization;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// Shared JSON options for persisting <see cref="Models.CategoryRule.Groups"/> as jsonb
/// and for round-tripping the same tree over HTTP.
/// </summary>
public static class CategoryRuleJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter() },
    };
}
