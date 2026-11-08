using System.Text.Json.Serialization;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace KeepItSimple.Api.Models;

public class ImportMappingColumn
{
    public string Header { get; set; } = "";
    public TransactionImporter.MappableField TargetField { get; set; } = TransactionImporter.MappableField.Ignore;
}

public class ImportMapping
{
    public const int MaxPerUser = 50;
    public const int MaxNameLength = 100;
    public const int MaxColumns = 200;

    private const string DuplicateNameMessage = "A mapping with this name already exists.";

    public int Id { get; set; }
    public string Name { get; set; } = "";

    // Owner; never sent to or read from the client.
    [JsonIgnore]
    public string UserId { get; set; } = "";

    public List<ImportMappingColumn> Columns { get; set; } = [];
    public DateTime UpdatedAt { get; set; }

    public static Task<List<ImportMapping>> GetAllAsync(string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            await dbContext.ImportMappings
                .Where(mapping => mapping.UserId == userId)
                .OrderBy(mapping => mapping.Name)
                .ToListAsync());
    }

    public static Task<ImportMapping?> GetByIdAsync(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            await dbContext.ImportMappings.FirstOrDefaultAsync(mapping => mapping.Id == id && mapping.UserId == userId));
    }

    public static Task<ImportMapping> CreateAsync(ImportMapping mapping, string userId)
    {
        Validate(mapping);

        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var names = await dbContext.ImportMappings
                .Where(existing => existing.UserId == userId)
                .Select(existing => existing.Name)
                .ToListAsync();
            // shortcut: count check is not atomic, two parallel creates can pass 50; fine for one user's UI, add a DB constraint if it matters.
            if (names.Count >= MaxPerUser)
            {
                throw new InvalidOperationException($"You can save up to {MaxPerUser} mappings.");
            }

            if (names.Any(name => string.Equals(name, mapping.Name, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException(DuplicateNameMessage);
            }

            mapping.Id = 0;
            mapping.UserId = userId;
            mapping.UpdatedAt = DateTime.UtcNow;
            dbContext.ImportMappings.Add(mapping);
            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                throw new InvalidOperationException(DuplicateNameMessage);
            }

            return mapping;
        });
    }

    public static Task<ImportMapping?> UpdateAsync(ImportMapping mapping, string userId)
    {
        Validate(mapping);

        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existing = await dbContext.ImportMappings
                .FirstOrDefaultAsync(row => row.Id == mapping.Id && row.UserId == userId);
            if (existing is null)
            {
                return null;
            }

            var names = await dbContext.ImportMappings
                .Where(other => other.UserId == userId && other.Id != mapping.Id)
                .Select(other => other.Name)
                .ToListAsync();
            if (names.Any(name => string.Equals(name, mapping.Name, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException(DuplicateNameMessage);
            }

            existing.Name = mapping.Name;
            existing.Columns = mapping.Columns;
            existing.UpdatedAt = DateTime.UtcNow;
            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                throw new InvalidOperationException(DuplicateNameMessage);
            }

            return existing;
        });
    }

    public static Task<bool> DeleteAsync(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existing = await dbContext.ImportMappings
                .FirstOrDefaultAsync(mapping => mapping.Id == id && mapping.UserId == userId);
            if (existing is null)
            {
                return false;
            }

            dbContext.ImportMappings.Remove(existing);
            await dbContext.SaveChangesAsync();
            return true;
        });
    }

    /// <summary>
    /// Picks the saved mapping that fits a file's header row, or null when none fits.
    /// A mapping is a candidate when every mapped (non-Ignore) header occurs exactly once in the file,
    /// compared case- and whitespace-insensitively. A renamed or missing mapped header means no match.
    /// Among candidates: an exact header set match wins, then more mapped columns, then the most recently updated.
    /// </summary>
    public static ImportMapping? FindBestMatch(IEnumerable<ImportMapping> mappings, IReadOnlyCollection<string> fileHeaders)
    {
        var fileCounts = fileHeaders
            .GroupBy(Normalize)
            .ToDictionary(group => group.Key, group => group.Count());
        var fileSet = fileCounts.Keys.ToHashSet();

        var candidates = new List<(ImportMapping Mapping, bool Exact, int MappedCount)>();
        foreach (var mapping in mappings)
        {
            var mapped = mapping.Columns
                .Where(column => column.TargetField != TransactionImporter.MappableField.Ignore)
                .ToList();
            if (!mapped.All(column => fileCounts.GetValueOrDefault(Normalize(column.Header)) == 1))
            {
                continue;
            }

            var savedSet = mapping.Columns.Select(column => Normalize(column.Header)).ToHashSet();
            candidates.Add((mapping, savedSet.SetEquals(fileSet), mapped.Count));
        }

        return candidates
            .OrderByDescending(candidate => candidate.Exact)
            .ThenByDescending(candidate => candidate.MappedCount)
            .ThenByDescending(candidate => candidate.Mapping.UpdatedAt)
            .Select(candidate => candidate.Mapping)
            .FirstOrDefault();
    }

    public static void Validate(ImportMapping mapping)
    {
        mapping.Columns ??= [];
        mapping.Name = (mapping.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(mapping.Name))
        {
            throw new ArgumentException("A mapping name is required.");
        }

        if (mapping.Name.Length > MaxNameLength)
        {
            throw new ArgumentException($"A mapping name can be up to {MaxNameLength} characters.");
        }

        if (mapping.Columns.Count == 0 || mapping.Columns.Count > MaxColumns)
        {
            throw new ArgumentException($"A mapping must have between 1 and {MaxColumns} columns.");
        }

        foreach (var column in mapping.Columns)
        {
            if (column is null || !Enum.IsDefined(column.TargetField))
            {
                throw new ArgumentException("Every column needs a valid target field.");
            }

            column.Header = (column.Header ?? string.Empty).Trim();
            if (column.Header.Length == 0)
            {
                throw new ArgumentException("Every column needs a header.");
            }
        }

        var headers = mapping.Columns.Select(column => Normalize(column.Header)).ToList();
        if (headers.Distinct().Count() != headers.Count)
        {
            throw new ArgumentException("Column headers must be unique.");
        }

        var targets = mapping.Columns
            .Where(column => column.TargetField != TransactionImporter.MappableField.Ignore)
            .Select(column => column.TargetField)
            .ToList();
        if (!targets.Contains(TransactionImporter.MappableField.Amount))
        {
            throw new ArgumentException("Mapping must include an Amount column.");
        }

        if (!targets.Contains(TransactionImporter.MappableField.Date))
        {
            throw new ArgumentException("Mapping must include a Date column.");
        }

        if (targets.Distinct().Count() != targets.Count)
        {
            throw new ArgumentException("Each field can be mapped to only one column.");
        }
    }

    private static string Normalize(string header) => header.Trim().ToLowerInvariant();
}
