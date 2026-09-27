using System.Collections.Concurrent;
using System.Globalization;
using System.Text;
using System.Text.Json.Serialization;
using ExcelDataReader;
using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// Imports bank/export files into <see cref="Transaction"/> records when the spreadsheet
/// layout is unknown. The UI never assumes fixed column names: the importer discovers
/// headers, the user maps them onto transaction fields, drafts are previewed, then saved.
/// <para>
/// <see cref="Analyze"/> opens .xls / .xlsx / .xlsm / .csv, finds the header row, stores
/// data rows in a session, and returns discovered columns with sample values.
/// </para>
/// <para>
/// <see cref="Preview"/> applies the column mapping and builds draft transactions.
/// Amount and Date must be mapped; Description and Category are optional. Pocket is chosen
/// in the UI, not read from the file. Nothing is persisted yet.
/// </para>
/// <para>
/// <see cref="Confirm"/> writes the reviewed drafts, updates the pocket balance, and
/// discards the session.
/// </para>
/// </summary>
public static class TransactionImporter
{
    // #TODO This can cause memory issues with large files, or with a massive number of sessions.
    private static readonly ConcurrentDictionary<Guid, ImportSession> Sessions = new();
    private static int _encodingsRegistered;
    private const int MIN_CONSECUTIVE_STRINGS = 3;
    private const int MAX_SAMPLE_ROWS = 10;

    /// <summary>
    /// The fields the UI can map columns onto.
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum MappableField
    {
        Ignore,
        Description,
        Amount,
        Date,
        Category,
    }

    // Italian labels for the optional Category column (stipendio → Salary). User-defined
    // description/amount/category rules run after this, in CategoryRuleMatcher.
    private static readonly Dictionary<string, Transaction.TransactionCategory> CategoryAliases =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["caffe"] = Transaction.TransactionCategory.Coffe,
            ["bar"] = Transaction.TransactionCategory.Coffe,
            ["cibo"] = Transaction.TransactionCategory.Food,
            ["ristorante"] = Transaction.TransactionCategory.Food,
            ["alimentari"] = Transaction.TransactionCategory.Groceries,
            ["trasporti"] = Transaction.TransactionCategory.Transport,
            ["trasporto"] = Transaction.TransactionCategory.Transport,
            ["intrattenimento"] = Transaction.TransactionCategory.Entertainment,
            ["utenze"] = Transaction.TransactionCategory.Utilities,
            ["bollette"] = Transaction.TransactionCategory.Utilities,
            ["acquisti"] = Transaction.TransactionCategory.Shopping,
            ["salute"] = Transaction.TransactionCategory.Health,
            ["sanita"] = Transaction.TransactionCategory.Health,
            ["istruzione"] = Transaction.TransactionCategory.School,
            ["educazione"] = Transaction.TransactionCategory.Education,
            ["viaggi"] = Transaction.TransactionCategory.Travel,
            ["viaggio"] = Transaction.TransactionCategory.Travel,
            ["vacanze"] = Transaction.TransactionCategory.Travel,
            ["vacanza"] = Transaction.TransactionCategory.Travel,
            ["sport"] = Transaction.TransactionCategory.Sport,
            ["abbonamenti"] = Transaction.TransactionCategory.Subscriptions,
            ["abbonamento"] = Transaction.TransactionCategory.Subscriptions,
            ["risparmi"] = Transaction.TransactionCategory.Savings,
            ["risparmio"] = Transaction.TransactionCategory.Savings,
            ["banca"] = Transaction.TransactionCategory.Savings,
            ["banche"] = Transaction.TransactionCategory.Savings,
            ["investimenti"] = Transaction.TransactionCategory.Investments,
            ["investimento"] = Transaction.TransactionCategory.Investments,
            ["regali"] = Transaction.TransactionCategory.Gifts,
            ["regalo"] = Transaction.TransactionCategory.Gifts,
            ["amore"] = Transaction.TransactionCategory.Love,
            ["beneficenza"] = Transaction.TransactionCategory.Charity,
            ["carita"] = Transaction.TransactionCategory.Charity,
            ["stipendio"] = Transaction.TransactionCategory.Salary,
            ["salario"] = Transaction.TransactionCategory.Salary,
            ["premio"] = Transaction.TransactionCategory.Bonus,
            ["vincita"] = Transaction.TransactionCategory.Bonus,
            ["vincite"] = Transaction.TransactionCategory.Bonus,
            ["partita iva"] = Transaction.TransactionCategory.Freelance,
            ["azienda"] = Transaction.TransactionCategory.Business,
            ["interessi"] = Transaction.TransactionCategory.Interest,
            ["interesse"] = Transaction.TransactionCategory.Interest,
            ["dividendi"] = Transaction.TransactionCategory.Dividends,
            ["dividendo"] = Transaction.TransactionCategory.Dividends,
            ["affitto"] = Transaction.TransactionCategory.RentalIncome,
            ["rimborso"] = Transaction.TransactionCategory.Refund,
            ["rimborsi"] = Transaction.TransactionCategory.Refund,
            ["altro"] = Transaction.TransactionCategory.Other,
            ["varie"] = Transaction.TransactionCategory.Other,
            ["auto"] = Transaction.TransactionCategory.Car,
            ["macchina"] = Transaction.TransactionCategory.Car,
            ["motori"] = Transaction.TransactionCategory.Car,
            ["abbigliamento"] = Transaction.TransactionCategory.Clothing,
            ["accessori"] = Transaction.TransactionCategory.Accessories,
            ["arredamento"] = Transaction.TransactionCategory.Furniture,
            ["casa"] = Transaction.TransactionCategory.Home,
            ["edicola"] = Transaction.TransactionCategory.Newsstand,
            ["eventi"] = Transaction.TransactionCategory.Events,
            ["informatica"] = Transaction.TransactionCategory.Computers,
            ["hotel"] = Transaction.TransactionCategory.Hotel,
            ["libri"] = Transaction.TransactionCategory.Books,
            ["moto"] = Transaction.TransactionCategory.Motorcycle,
            ["musica"] = Transaction.TransactionCategory.Music,
            ["palestra"] = Transaction.TransactionCategory.Gym,
            ["parrucchiere"] = Transaction.TransactionCategory.Hairdresser,
            ["persona"] = Transaction.TransactionCategory.Personal,
            ["riparazioni"] = Transaction.TransactionCategory.Repairs,
            ["relazioni"] = Transaction.TransactionCategory.Relationships,
            ["servizi"] = Transaction.TransactionCategory.Services,
            ["speciali"] = Transaction.TransactionCategory.Special,
            ["spesa"] = Transaction.TransactionCategory.Groceries,
            ["svago"] = Transaction.TransactionCategory.Leisure,
            ["tasse"] = Transaction.TransactionCategory.Taxes,
            ["telefono"] = Transaction.TransactionCategory.Phone,
            ["film"] = Transaction.TransactionCategory.Film,
            ["loan"] = Transaction.TransactionCategory.Loan,
            ["prestito"] = Transaction.TransactionCategory.Loan,
            ["prestiti"] = Transaction.TransactionCategory.Loan,
            ["finanziamento"] = Transaction.TransactionCategory.Loan,
            ["transfer"] = Transaction.TransactionCategory.Transfer,
            ["transferimento"] = Transaction.TransactionCategory.Transfer,
            ["trasferimento"] = Transaction.TransactionCategory.Transfer,
            ["bonifico"] = Transaction.TransactionCategory.Transfer,
            ["giroconto"] = Transaction.TransactionCategory.Transfer,
            ["withdraw"] = Transaction.TransactionCategory.Withdraw,
            ["withdrawal"] = Transaction.TransactionCategory.Withdraw,
            ["prelievo"] = Transaction.TransactionCategory.Withdraw,
            ["prelievi"] = Transaction.TransactionCategory.Withdraw,
            ["contanti"] = Transaction.TransactionCategory.Withdraw,
            ["cash"] = Transaction.TransactionCategory.Withdraw,
        };

    public static AnalyzeResponse Analyze(Stream fileStream)
    {
        // Ensure the .xls can be parsed by ExcelDataReader
        EnsureEncodingsRegistered();

        // Seekable copy: ExcelDataReader needs it for .xls / format detection
        using var buffer = new MemoryStream();
        fileStream.CopyTo(buffer);
        buffer.Position = 0;

        using var reader = OpenSpreadsheet(buffer);
        var columns = DetectHeaderColumns(reader);
        var (rows, samples) = ReadDataRows(reader, columns);

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
        };
    }

    /// <summary>
    /// .xls / .xlsx have a binary signature. CSV does not, so ExcelDataReader needs its CSV reader.
    /// </summary>
    private static IExcelDataReader OpenSpreadsheet(MemoryStream buffer)
    {
        try
        {
            return ExcelReaderFactory.CreateReader(buffer);
        }
        catch (Exception)
        {
            buffer.Position = 0;
            return ExcelReaderFactory.CreateCsvReader(buffer);
        }
    }

    /// <summary>
    /// Skips preamble rows until a header is found: at least
    /// <see cref="MIN_CONSECUTIVE_STRINGS"/> consecutive non-empty strings
    /// (date, description/causale, amount).
    /// </summary>
    private static List<ExcelColumn> DetectHeaderColumns(IExcelDataReader reader)
    {
        while (reader.Read())
        {
            if (TryDetectHeaderRow(reader, out var columns) && columns is { Count: > 0 })
            {
                return columns;
            }
        }

        throw new InvalidOperationException(
            $"No header row found. Expected a row with at least {MIN_CONSECUTIVE_STRINGS} consecutive text columns.");
    }

    /// <summary>
    /// Reads remaining non-empty rows after the header. Session rows are keyed by
    /// 1-based column index; sample rows are keyed by column name for the UI.
    /// </summary>
    private static (List<Dictionary<int, string>> Rows, List<Dictionary<string, string>> Samples)
        ReadDataRows(IExcelDataReader reader, List<ExcelColumn> columns)
    {
        var rows = new List<Dictionary<int, string>>();
        var samples = new List<Dictionary<string, string>>();

        while (reader.Read())
        {
            if (IsEmptyRow(reader, columns))
            {
                continue;
            }

            var dict = new Dictionary<int, string>();
            var collectSample = samples.Count < MAX_SAMPLE_ROWS;
            var sample = collectSample ? new Dictionary<string, string>() : null;

            foreach (var col in columns)
            {
                var value = FormatCell(reader, col.Index - 1);
                dict[col.Index] = value;
                sample?[col.Name] = value;
            }

            rows.Add(dict);
            if (sample is not null)
            {
                samples.Add(sample);
            }
        }

        return (rows, samples);
    }

    /// <summary>
    /// A header row has at least MIN_CONSECUTIVE_STRINGS consecutive cells with valid non-empty strings.
    /// When found, every non-empty string cell on that row becomes a mappable column.
    /// </summary>
    private static bool TryDetectHeaderRow(IExcelDataReader reader, out List<ExcelColumn>? columns)
    {
        columns = null;
        var consecutive = 0;
        var hasThreeConsecutive = false;
        var detected = new List<ExcelColumn>();

        for (var i = 0; i < reader.FieldCount; i++)
        {
            var value = reader.GetValue(i);
            if (!IsValidHeaderString(value))
            {
                consecutive = 0;
                continue;
            }

            consecutive++;
            if (consecutive >= MIN_CONSECUTIVE_STRINGS)
            {
                hasThreeConsecutive = true;
            }

            detected.Add(new ExcelColumn
            {
                Index = i + 1,
                Name = ((string)value!).Trim(),
            });
        }

        if (!hasThreeConsecutive)
        {
            return false;
        }

        columns = detected;
        return true;
    }

    private static bool IsValidHeaderString(object? value)
    {
        return value is string headerString && !string.IsNullOrWhiteSpace(headerString);
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

    /// <summary>
    /// Applies the user's column mapping to the session opened by <see cref="Analyze"/>
    /// and builds draft <see cref="Transaction"/> records. Amount and Date must be mapped;
    /// Description and Category are optional. After column parsing, enabled
    /// <see cref="CategoryRule"/>s (first match by sort order) can override the category.
    /// Rows that fail to parse are collected in
    /// <see cref="PreviewResponse.Errors"/> instead of aborting the whole preview.
    /// Nothing is written to the database.
    /// </summary>
    public static PreviewResponse Preview(PreviewRequest request, IReadOnlyList<CategoryRule>? rules = null)
    {
        if (!Sessions.TryGetValue(request.SessionId, out var session))
        {
            throw new KeyNotFoundException("Import session expired or not found. Re-upload the file.");
        }

        ValidateMapping(request.Mapping);

        var drafts = new List<Transaction>();
        var errors = new List<string>();
        var appliedRules = rules ?? [];

        for (var i = 0; i < session.Rows.Count; i++)
        {
            var row = session.Rows[i];
            var rowNumber = i + 2; // Excel is 1-indexed and row 1 is the header

            try
            {
                drafts.Add(BuildTransaction(
                    row,
                    request.Mapping,
                    request.PocketId,
                    request.DefaultCategory,
                    appliedRules));
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

    /// <summary>
    /// Persists the reviewed draft transactions from <see cref="Preview"/> into the given
    /// pocket, updates its balance, and discards the import session. Draft ids are ignored
    /// so callers cannot overwrite existing rows; <c>PocketId</c> always comes from the request.
    /// </summary>
    public static Task<ConfirmResponse> Confirm(ConfirmRequest request)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var pocket = await dbContext.Pockets.FindAsync(request.PocketId) ?? throw new KeyNotFoundException($"Pocket {request.PocketId} not found.");
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

    private static void ValidateMapping(List<ColumnMapping> mapping)
    {
        var targets = mapping
            .Where(m => m.TargetField != MappableField.Ignore)
            .Select(m => m.TargetField)
            .ToList();

        if (!targets.Contains(MappableField.Amount))
        {
            throw new ArgumentException("Mapping must include an Amount column.");
        }

        if (!targets.Contains(MappableField.Date))
        {
            throw new ArgumentException("Mapping must include a Date column.");
        }

        var duplicates = targets.GroupBy(t => t).Where(g => g.Count() > 1).Select(g => g.Key);
        if (duplicates.Any())
        {
            throw new ArgumentException($"Duplicate mappings: {string.Join(", ", duplicates)}");
        }
    }

    /// <summary>
    /// Builds a <see cref="Transaction"/> record from a row of the session opened by <see cref="Analyze"/>
    /// and the user's column mapping. Amount and Date must be mapped; Description and Category are optional.
    /// </summary>
    private static Transaction BuildTransaction(
        Dictionary<int, string> row,
        List<ColumnMapping> mapping,
        int pocketId,
        Transaction.TransactionCategory defaultCategory,
        IReadOnlyList<CategoryRule> rules)
    {
        string? description = null;
        decimal? amount = null;
        DateTime? date = null;
        var category = defaultCategory;

        foreach (var map in mapping)
        {
            if (map.TargetField is MappableField.Ignore)
            {
                continue;
            }

            if (!row.TryGetValue(map.ColumnIndex, out var raw) || string.IsNullOrWhiteSpace(raw))
            {
                continue;
            }

            switch (map.TargetField)
            {
                case MappableField.Description:
                    description = raw.Trim();
                    break;

                case MappableField.Amount:
                    amount = ParseAmount(raw);
                    break;

                case MappableField.Date:
                    date = ParseDate(raw);
                    break;

                case MappableField.Category:
                    if (TryParseCategory(raw, out var parsed))
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

        var matchedRule = CategoryRuleMatcher.FindMatch(description, amount.Value, category, rules, pocketId);
        if (matchedRule is not null)
        {
            category = matchedRule.TargetCategory;
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

    /// <summary>
    /// Tries to parse the category from the raw string.
    /// If the category is not found in the <see cref="Transaction.TransactionCategory"/> enum, 
    /// it tries to parse it using the <see cref="CategoryAliases"/> dictionary.
    /// </summary>
    private static bool TryParseCategory(string raw, out Transaction.TransactionCategory category)
    {
        var key = NormalizeCategoryLabel(raw);
        if (Enum.TryParse(key, ignoreCase: true, out category))
        {
            return true;
        }

        return CategoryAliases.TryGetValue(key, out category);
    }

    private static string NormalizeCategoryLabel(string raw)
    {
        var decomposed = raw.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static decimal ParseAmount(string raw)
    {
        // Keep digits/sign/separators only: "−356 €", "$12.50", "USD -90" all reduce to a number.
        var normalized = StripAmountNoise(raw);

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

    private static string StripAmountNoise(string raw)
    {
        var builder = new StringBuilder(raw.Length);
        foreach (var character in raw)
        {
            if (char.IsWhiteSpace(character))
            {
                continue;
            }

            var mapped = character switch
            {
                '\u2212' or '\u2012' or '\u2013' => '-',
                _ => character,
            };

            if (mapped is '+' or '-' or '.' or ',' || char.IsAsciiDigit(mapped))
            {
                builder.Append(mapped);
            }
        }

        return builder.ToString();
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

        /// <summary>Target <see cref="MappableField"/> for this column.</summary>
        public MappableField TargetField { get; set; } = MappableField.Ignore;
    }
}
