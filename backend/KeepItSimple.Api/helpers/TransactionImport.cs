using System.Collections.Concurrent;
using System.Globalization;
using System.Text;
using System.Text.Json.Serialization;
using ExcelDataReader;
using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// POC: 3-step file → Transaction import flow (.xls / .xlsx / .csv).
/// 1. Analyze  – discover columns from an unknown file layout
/// 2. Preview  – apply user column mapping and build draft transactions
/// 3. Confirm  – persist the reviewed transactions
/// </summary>
public class TransactionImport
{
    private static readonly ConcurrentDictionary<Guid, ImportSession> Sessions = new();
    private static int _encodingsRegistered;

    // ── Target fields the UI can map columns onto ────────────────────────────

    public static readonly string[] MappableFields =
    [
        "Ignore",
        "Description",
        "Amount",
        "Date",
        "Category",
    ];

    // ── Step 1: Analyze ──────────────────────────────────────────────────────

    public static AnalyzeResponse Analyze(Stream fileStream, string fileName)
    {
        EnsureEncodingsRegistered();

        // Seekable copy: ExcelDataReader needs it for .xls / format detection
        using var buffer = new MemoryStream();
        fileStream.CopyTo(buffer);
        buffer.Position = 0;

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        using var reader = extension == ".csv"
            ? ExcelReaderFactory.CreateCsvReader(buffer, new ExcelReaderConfiguration
            {
                // Banks / EU exports often use ';'
                AutodetectSeparators = [',', ';', '\t', '|'],
            })
            : ExcelReaderFactory.CreateReader(buffer);

        // Skip preamble rows until we find a header: ≥3 consecutive valid strings
        // (minimum expected: date, description/causale, amount).
        List<ExcelColumn>? columns = null;
        while (reader.Read())
        {
            if (TryDetectHeaderRow(reader, out columns))
            {
                break;
            }
        }

        if (columns is null || columns.Count == 0)
        {
            throw new InvalidOperationException(
                "No header row found. Expected a row with at least 3 consecutive text columns.");
        }

        var rows = new List<Dictionary<int, string>>();
        var samples = new List<Dictionary<string, string>>();

        while (reader.Read())
        {
            if (IsEmptyRow(reader, columns))
            {
                continue;
            }

            var dict = new Dictionary<int, string>();
            foreach (var col in columns)
            {
                dict[col.Index] = FormatCell(reader, col.Index - 1);
            }
            rows.Add(dict);

            if (samples.Count < 5)
            {
                var sample = new Dictionary<string, string>();
                foreach (var col in columns)
                {
                    sample[col.Name] = dict[col.Index];
                }
                samples.Add(sample);
            }
        }

        var sessionId = Guid.NewGuid();
        Sessions[sessionId] = new ImportSession
        {
            Columns = columns,
            Rows = rows,
            CreatedAt = DateTime.UtcNow,
        };

        return new AnalyzeResponse
        {
            SessionId = sessionId,
            Columns = columns,
            SampleRows = samples,
            MappableFields = MappableFields,
        };
    }

    /// <summary>
    /// A header row has at least 3 consecutive cells with valid non-empty strings.
    /// When found, every non-empty string cell on that row becomes a mappable column.
    /// </summary>
    private static bool TryDetectHeaderRow(IExcelDataReader reader, out List<ExcelColumn>? columns)
    {
        columns = null;
        var fieldCount = reader.FieldCount;
        var consecutive = 0;
        var hasThreeConsecutive = false;

        for (var i = 0; i < fieldCount; i++)
        {
            if (IsValidHeaderString(reader.GetValue(i)))
            {
                consecutive++;
                if (consecutive >= 3)
                {
                    hasThreeConsecutive = true;
                    break;
                }
            }
            else
            {
                consecutive = 0;
            }
        }

        if (!hasThreeConsecutive)
        {
            return false;
        }

        var detected = new List<ExcelColumn>();
        for (var i = 0; i < fieldCount; i++)
        {
            var value = reader.GetValue(i);
            if (!IsValidHeaderString(value))
            {
                continue;
            }

            detected.Add(new ExcelColumn
            {
                Index = i + 1,
                Name = ((string)value!).Trim(),
            });
        }

        if (detected.Count == 0)
        {
            return false;
        }

        columns = detected;
        return true;
    }

    private static bool IsValidHeaderString(object? value)
    {
        return value is string s && !string.IsNullOrWhiteSpace(s);
    }

    private static void EnsureEncodingsRegistered()
    {
        if (Interlocked.Exchange(ref _encodingsRegistered, 1) == 0)
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        }
    }

    private static bool IsEmptyRow(IExcelDataReader reader, List<ExcelColumn> columns)
    {
        return columns.All(col => string.IsNullOrWhiteSpace(FormatCell(reader, col.Index - 1)));
    }

    private static string FormatCell(IExcelDataReader reader, int zeroBasedIndex)
    {
        if (zeroBasedIndex < 0 || zeroBasedIndex >= reader.FieldCount)
        {
            return string.Empty;
        }

        var value = reader.GetValue(zeroBasedIndex);
        return value switch
        {
            null => string.Empty,
            DateTime dt => dt.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
            double d when reader.GetFieldType(zeroBasedIndex) == typeof(DateTime)
                => DateTime.FromOADate(d).ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
            double d => d.ToString(CultureInfo.InvariantCulture),
            float f => f.ToString(CultureInfo.InvariantCulture),
            decimal m => m.ToString(CultureInfo.InvariantCulture),
            bool b => b.ToString(),
            _ => Convert.ToString(value, CultureInfo.InvariantCulture)?.Trim() ?? string.Empty,
        };
    }

    // ── Step 2: Preview ──────────────────────────────────────────────────────

    public static PreviewResponse Preview(PreviewRequest request)
    {
        if (!Sessions.TryGetValue(request.SessionId, out var session))
        {
            throw new KeyNotFoundException("Import session expired or not found. Re-upload the file.");
        }

        ValidateMapping(request.Mapping);

        var drafts = new List<Transaction>();
        var errors = new List<string>();

        for (var i = 0; i < session.Rows.Count; i++)
        {
            var row = session.Rows[i];
            var rowNumber = i + 2; // Excel is 1-indexed and row 1 is the header

            try
            {
                drafts.Add(BuildTransaction(row, request.Mapping, request.PocketId, request.DefaultCategory));
            }
            catch (Exception ex)
            {
                errors.Add($"Row {rowNumber}: {ex.Message}");
            }
        }

        return new PreviewResponse
        {
            SessionId = request.SessionId,
            Transactions = drafts,
            Errors = errors,
        };
    }

    // ── Step 3: Confirm ──────────────────────────────────────────────────────

    public static Task<ConfirmResponse> Confirm(ConfirmRequest request)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var pocket = await dbContext.Pockets.FindAsync(request.PocketId);
            if (pocket is null)
            {
                throw new KeyNotFoundException($"Pocket {request.PocketId} not found.");
            }

            var saved = new List<Transaction>();

            foreach (var draft in request.Transactions)
            {
                draft.Id = null;
                draft.PocketId = pocket.Id;
                draft.Pocket = pocket;

                pocket.Balance += draft.Amount;
                dbContext.Transactions.Add(draft);
                saved.Add(draft);
            }

            await dbContext.SaveChangesAsync();

            // Session no longer needed
            Sessions.TryRemove(request.SessionId, out _);

            return new ConfirmResponse
            {
                SavedCount = saved.Count,
                Transactions = saved,
            };
        });
    }

    // ── Internals ────────────────────────────────────────────────────────────

    private static void ValidateMapping(List<ColumnMapping> mapping)
    {
        var targets = mapping
            .Where(m => m.TargetField != "Ignore")
            .Select(m => m.TargetField)
            .ToList();

        if (targets.Contains("Amount") == false)
        {
            throw new ArgumentException("Mapping must include an Amount column.");
        }

        if (targets.Contains("Date") == false)
        {
            throw new ArgumentException("Mapping must include a Date column.");
        }

        var duplicates = targets.GroupBy(t => t).Where(g => g.Count() > 1).Select(g => g.Key);
        if (duplicates.Any())
        {
            throw new ArgumentException($"Duplicate mappings: {string.Join(", ", duplicates)}");
        }
    }

    private static Transaction BuildTransaction(
        Dictionary<int, string> row,
        List<ColumnMapping> mapping,
        int pocketId,
        Transaction.TransactionCategory defaultCategory)
    {
        string? description = null;
        decimal? amount = null;
        DateTime? date = null;
        var category = defaultCategory;

        foreach (var map in mapping)
        {
            if (map.TargetField == "Ignore")
            {
                continue;
            }

            if (!row.TryGetValue(map.ColumnIndex, out var raw) || string.IsNullOrWhiteSpace(raw))
            {
                continue;
            }

            switch (map.TargetField)
            {
                case "Description":
                    description = raw.Trim();
                    break;

                case "Amount":
                    amount = ParseAmount(raw);
                    break;

                case "Date":
                    date = ParseDate(raw);
                    break;

                case "Category":
                    if (Enum.TryParse<Transaction.TransactionCategory>(raw.Trim(), ignoreCase: true, out var parsed))
                    {
                        category = parsed;
                    }
                    break;
            }
        }

        if (amount is null)
        {
            throw new InvalidOperationException("Missing or invalid Amount.");
        }

        if (date is null)
        {
            throw new InvalidOperationException("Missing or invalid Date.");
        }

        return new Transaction
        {
            Description = description,
            Amount = amount.Value,
            Date = DateTime.SpecifyKind(date.Value, DateTimeKind.Utc),
            Category = category,
            PocketId = pocketId,
        };
    }

    private static decimal ParseAmount(string raw)
    {
        // Accept both "1.234,56" and "1,234.56" / plain "1234.56"
        var normalized = raw.Trim()
            .Replace("€", "")
            .Replace(" ", "")
            .Trim();

        if (normalized.Contains(',') && normalized.Contains('.'))
        {
            // Decide decimal separator by whichever comes last
            if (normalized.LastIndexOf(',') > normalized.LastIndexOf('.'))
            {
                normalized = normalized.Replace(".", "").Replace(',', '.');
            }
            else
            {
                normalized = normalized.Replace(",", "");
            }
        }
        else if (normalized.Contains(','))
        {
            normalized = normalized.Replace(',', '.');
        }

        if (decimal.TryParse(normalized, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
        {
            return value;
        }

        throw new InvalidOperationException($"Cannot parse amount '{raw}'.");
    }

    private static DateTime ParseDate(string raw)
    {
        var formats = new[]
        {
            "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy-MM-dd",
            "dd/MM/yy", "d/M/yy", "MM/dd/yyyy", "M/d/yyyy",
        };

        if (DateTime.TryParseExact(raw.Trim(), formats, CultureInfo.InvariantCulture,
                DateTimeStyles.None, out var exact))
        {
            return exact;
        }

        if (DateTime.TryParse(raw.Trim(), CultureInfo.GetCultureInfo("it-IT"),
                DateTimeStyles.None, out var it))
        {
            return it;
        }

        if (DateTime.TryParse(raw.Trim(), CultureInfo.InvariantCulture,
                DateTimeStyles.None, out var invariant))
        {
            return invariant;
        }

        // Excel serial date number
        if (double.TryParse(raw.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var oaDate))
        {
            return DateTime.FromOADate(oaDate);
        }

        throw new InvalidOperationException($"Cannot parse date '{raw}'.");
    }

    // ── Session / DTO types ──────────────────────────────────────────────────

    private sealed class ImportSession
    {
        public required List<ExcelColumn> Columns { get; init; }
        public required List<Dictionary<int, string>> Rows { get; init; }
        public required DateTime CreatedAt { get; init; }
    }

    public class ExcelColumn
    {
        public int Index { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ColumnMapping
    {
        /// <summary>1-based Excel column index from Analyze.</summary>
        public int ColumnIndex { get; set; }

        /// <summary>One of MappableFields: Ignore | Description | Amount | Date | Category.</summary>
        public string TargetField { get; set; } = "Ignore";
    }

    public class AnalyzeResponse
    {
        public Guid SessionId { get; set; }
        public List<ExcelColumn> Columns { get; set; } = [];
        public List<Dictionary<string, string>> SampleRows { get; set; } = [];
        public string[] MappableFields { get; set; } = [];
    }

    public class PreviewRequest
    {
        public Guid SessionId { get; set; }
        public int PocketId { get; set; }
        public List<ColumnMapping> Mapping { get; set; } = [];

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public Transaction.TransactionCategory DefaultCategory { get; set; } = Transaction.TransactionCategory.Other;
    }

    public class PreviewResponse
    {
        public Guid SessionId { get; set; }
        public List<Transaction> Transactions { get; set; } = [];
        public List<string> Errors { get; set; } = [];
    }

    public class ConfirmRequest
    {
        public Guid SessionId { get; set; }
        public int PocketId { get; set; }
        public List<Transaction> Transactions { get; set; } = [];
    }

    public class ConfirmResponse
    {
        public int SavedCount { get; set; }
        public List<Transaction> Transactions { get; set; } = [];
    }
}
