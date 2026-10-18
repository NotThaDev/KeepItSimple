using System.Runtime.CompilerServices;
using KeepItSimple.Api.Helpers;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace KeepItSimple.Api.Tests.Support;

// The models persist through the static KeepItSimpleContext singleton, so it is set up once for the whole test run
// with an in-memory database. Tests isolate their rows by using fresh user ids.
public static class TestApp
{
    [ModuleInitializer]
    internal static void Initialize()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddDbContext<KeepItSimpleDbContext>(options => options.UseInMemoryDatabase("keepitsimple-tests"));
        KeepItSimpleContext.InitContext(builder.Build());
    }

    public static string NewUserId() => $"user-{Guid.NewGuid()}";
}
