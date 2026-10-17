---
name: backend
description: >-
  Implement KeepItSimple backend features: ASP.NET Core controllers, active-record
  models, DTOs, helpers, EF Core, and xUnit tests. Use when adding or changing
  API endpoints, models, persistence, helpers, or tests under backend/. When the
  user asks for a backend structure change, update this skill so it matches the
  new structure.
---

# Backend

KeepItSimple API is an ASP.NET Core app (`net10`) in `backend/KeepItSimple.Api`. Controllers only handle HTTP. Entities own persistence. Pure rules live in helpers and are tested without a database.

## Keep this skill current

When the user asks for a change to backend structure, update this file in the same change. Structure means folders, how controllers, models, DTOs, and helpers are split, persistence access, or the test layout.

A new endpoint that follows the rules already written here does not need a skill edit. If the requested change replaces a rule, rewrite that section so it describes the new structure and drop the old one.

## Documentation

When you add or change a complex feature, update its feature markdown in the same change. Complex means a multi-step flow, matching rules, import, or other behavior that is hard to see from the code alone. A simple screen that only lists or edits one entity does not need its own markdown.

The overview README stays at the top of the app folder (`backend/README.md`, `frontend/README.md`). Feature notes go in that app's `docs/` folder.

If a feature markdown already exists, update it. Backend notes today are `docs/CategoryRules.md`, `CategoryRuleMatcher.md`, `TransactionImportFlow.md`, and `TransactionImportUtil.md`. If the feature is complex and has none, add one under `backend/docs/` when the note is about the API, or `frontend/docs/` when it is about the UI. A flow doc covers the UI and API conversation. A helper doc covers pure logic that needs its own explanation. Link a new doc from that app's top-level README.

Also update the overview README whose contents the change affects:

- `README.md` — "What you can do" and "In the app" when a user-facing area is added or its behavior changes.
- `frontend/README.md` — the page table, stack, or how to run the UI.
- `backend/README.md` — domains, layout, feature-doc links, tests, or how to run the API.

Leave an overview README alone when the change does not alter what that file describes.

## Folder map

```
backend/
  README.md                 # overview of the API, domains, and how to run it
  docs/                     # feature notes
  KeepItSimple.Api/
    controllers/          # HTTP only
    dtos/<Domain>/        # request and response types that are not the entity
    helpers/              # pure logic, queries, importer, DbContext access, service setup
    models/               # entities and their static persistence methods
      analytics/          # aggregation types and Analytics static methods
    Migrations/           # EF Core; do not edit migrations that already shipped
    Program.cs
  Tests/KeepItSimple.Api.Tests/
    <feature>/            # one folder per area under test
    support/              # fixtures and the xUnit framework wrapper
```

Folders on disk are lowercase (`controllers`, `models`, `helpers`, `dtos`). Namespaces stay as they already are: `KeepItSimple.Api.Controllers`, `KeepItSimple.Api.Models`, `KeepItSimple.Api.Helpers`, and `KeepItSimple.Api.dtos.<Domain>`.

One public type per file. The file name is the type name. Use a file-scoped namespace. Nullable reference types are on.

## Controllers

A controller is `[ApiController]`, extends `ControllerBase`, and sets `[Route("api/...")]`. It does not take a `DbContext` and does not run queries.

```csharp
[HttpGet("{id}")]
public async Task<ActionResult<Pocket>> GetById(int id)
{
    var pocket = await Pocket.GetByIdAsync(id);
    if (pocket == null)
    {
        return NotFound();
    }
    return Ok(pocket);
}
```

- Bind the entity when the body is the entity. Bind a DTO when the body is a command or the response is a different shape (`TransferRequest`, `PreviewRequest`, `PagedTransactionsResponse`).
- On create, reject a body that already has an id. On update, set the id from the route before calling the model.
- `ArgumentException` from the model becomes `BadRequest(ex.Message)`. Missing rows become `NotFound`. Delete returns `NoContent`. Create returns `CreatedAtAction`.
- Keep request-shape checks in the action (empty id list, same pocket on both sides of a transfer). Domain checks (`Validate`, matching, normalization) stay on the model or a helper.

Existing prefixes: `/api/pocket`, `/api/transactions`, `/api/category-rules`, `/api/analytics`. `TestDataController` is `#if DEBUG` and returns `NotFound` outside Development.

## Models

Entities are active records in `models/`. Properties are the columns. Static methods load and save through `KeepItSimpleContext.Context.WithDbContextAsync`. Do not open a context any other way.

- `Id == 0` (or null on `Transaction`) means create. Copy incoming fields onto the tracked row on update.
- Call `Normalize` and `Validate` on the entity before `SaveChangesAsync` when the domain has those methods.
- Put the enum on the entity file when only that entity uses it (`TransactionCategory` on `Transaction`, `RuleLogic` / `RuleField` / `RuleOperator` beside `CategoryRule`).
- Mark enum properties that go over the wire with `[JsonConverter(typeof(JsonStringEnumConverter))]`. The database still stores them as integers.
- Mark navigation properties with `[JsonIgnore]`.
- Add a `DbSet` and the relationship in `KeepItSimpleDbContext.OnModelCreating`. JSON columns use `jsonb` plus a value comparer, as `CategoryRule.Groups` does.
- Schema changes get a new EF Core migration. Do not edit a migration that is already in the tree.

Analytics lives in `models/analytics/`. `Analytics` is a static class: `Get*Async` loads through the entities, `Build*` is pure and takes the lists plus a `DateTime`. Tests call `Build*`.

## DTOs and helpers

Add a DTO only when the HTTP type is not the entity: filters, commands, paged results, import, preview, apply. Put it in `dtos/<Domain>/` as its own file.

Put logic that does not need the database in a static helper (`CategoryRuleMatcher`, `TransactionQuery`, `CurrencyHelper`). The helper takes the values it needs. Callers load entities and pass them in. `TransactionImporter` stays the home for analyze, preview, and confirm.

Service registration that is more than one call goes in a static `*Setup` class in `helpers/` with an `IServiceCollection` extension method (`IdentitySetup.AddKeepItSimpleIdentity`). `Program.cs` calls the extension and stays a list of registrations.

## Tests

`dotnet test KeepItSimple.sln` from the repo root. xUnit, one class per file, folder per area.

- Test pure helpers and `Build*` methods with in-memory data. Do not stand up Postgres for them.
- Name tests `Method_condition_expected`.
- Import fixtures are generated by `ExcelFixtureGenerator` into the test output. Do not commit them.
- A behavior change in the matcher, importer, query, or analytics needs a test next to the existing ones in that folder.

## Do not

- Query EF from a controller
- Add a repository or service layer beside the entity
- Return an anonymous object when a DTO file is the pattern for that response
- Call `fetch`-style HTTP or build a second DbContext entry point
- Hand-edit `Migrations/` history or `KeepItSimpleDbContextModelSnapshot` instead of adding a migration
- Commit generated Excel or CSV fixtures
- Leave a complex feature change undocumented when its markdown exists, or skip creating one when the feature is new and complex
- Rewrite `README.md`, `frontend/README.md`, or `backend/README.md` for a change that does not alter what that file describes
