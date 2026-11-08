using System.Text.Json;
using System.Text.Json.Serialization;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// Shared JSON options for persisting <see cref="Models.ImportMapping.Columns"/> as jsonb
/// and for round-tripping the same list over HTTP.
/// </summary>
public static class ImportMappingJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter() },
    };
}
