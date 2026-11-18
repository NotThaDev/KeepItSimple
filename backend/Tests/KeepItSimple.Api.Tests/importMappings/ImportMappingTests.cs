using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Tests.Support;
using Field = KeepItSimple.Api.Helpers.TransactionImporter.MappableField;

namespace KeepItSimple.Api.Tests.ImportMappings;

public class ImportMappingTests
{
    [Fact]
    public async Task Create_get_update_delete_round_trip()
    {
        var owner = TestApp.NewUserId();

        var created = await ImportMapping.CreateAsync(NewMapping("Bank A"), owner);
        Assert.NotEqual(0, created.Id);
        Assert.NotEqual(default, created.UpdatedAt);

        var loaded = await ImportMapping.GetByIdAsync(created.Id, owner);
        Assert.NotNull(loaded);
        Assert.Equal(3, loaded!.Columns.Count);
        Assert.Equal(Field.Amount, loaded.Columns[1].TargetField);

        var edited = NewMapping("Bank A renamed");
        edited.Id = created.Id;
        var updated = await ImportMapping.UpdateAsync(edited, owner);
        Assert.Equal("Bank A renamed", updated!.Name);
        Assert.True(updated.UpdatedAt >= created.UpdatedAt);

        Assert.True(await ImportMapping.DeleteAsync(created.Id, owner));
        Assert.Null(await ImportMapping.GetByIdAsync(created.Id, owner));
    }

    [Fact]
    public void Validate_without_amount_throws()
    {
        var mapping = NewMapping("no amount");
        mapping.Columns[1].TargetField = Field.Ignore;

        Assert.Throws<ArgumentException>(() => ImportMapping.Validate(mapping));
    }

    [Fact]
    public void Validate_without_date_throws()
    {
        var mapping = NewMapping("no date");
        mapping.Columns[0].TargetField = Field.Ignore;

        Assert.Throws<ArgumentException>(() => ImportMapping.Validate(mapping));
    }

    [Fact]
    public void Validate_field_used_twice_throws()
    {
        var mapping = NewMapping("two descriptions");
        mapping.Columns[0].TargetField = Field.Description;
        mapping.Columns.Add(new ImportMappingColumn { Header = "Note", TargetField = Field.Description });

        Assert.Throws<ArgumentException>(() => ImportMapping.Validate(mapping));
    }

    [Fact]
    public void Validate_empty_name_throws()
    {
        var mapping = NewMapping("   ");

        Assert.Throws<ArgumentException>(() => ImportMapping.Validate(mapping));
    }

    [Fact]
    public void Validate_duplicate_header_ignoring_case_throws()
    {
        var mapping = NewMapping("dup header");
        mapping.Columns[1].Header = " date ";

        Assert.Throws<ArgumentException>(() => ImportMapping.Validate(mapping));
    }

    [Fact]
    public async Task Create_duplicate_name_ignoring_case_throws()
    {
        var owner = TestApp.NewUserId();
        await ImportMapping.CreateAsync(NewMapping("Bank A"), owner);

        await Assert.ThrowsAsync<InvalidOperationException>(() => ImportMapping.CreateAsync(NewMapping("bank a"), owner));
    }

    [Fact]
    public async Task Update_duplicate_name_ignoring_case_throws()
    {
        var owner = TestApp.NewUserId();
        await ImportMapping.CreateAsync(NewMapping("Bank A"), owner);
        var second = await ImportMapping.CreateAsync(NewMapping("Bank B"), owner);

        var rename = NewMapping("BANK a");
        rename.Id = second.Id;
        await Assert.ThrowsAsync<InvalidOperationException>(() => ImportMapping.UpdateAsync(rename, owner));
    }

    [Fact]
    public async Task Create_51st_mapping_throws()
    {
        var owner = TestApp.NewUserId();
        for (var index = 0; index < ImportMapping.MaxPerUser; index++)
        {
            await ImportMapping.CreateAsync(NewMapping($"Mapping {index}"), owner);
        }

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => ImportMapping.CreateAsync(NewMapping("Mapping extra"), owner));
        Assert.Equal("You can save up to 50 mappings.", ex.Message);
    }

    private static ImportMapping NewMapping(string name) => new()
    {
        Name = name,
        Columns =
        [
            new ImportMappingColumn { Header = "Date", TargetField = Field.Date },
            new ImportMappingColumn { Header = "Amount", TargetField = Field.Amount },
            new ImportMappingColumn { Header = "Description", TargetField = Field.Description },
        ],
    };
}
