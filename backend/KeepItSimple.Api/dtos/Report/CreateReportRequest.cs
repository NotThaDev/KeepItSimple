using System.Text.Json.Serialization;
using KeepItSimple.Api.Models.Reports;

namespace KeepItSimple.Api.dtos.Report;

public class CreateReportRequest
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReportPeriod Period { get; set; }
}
