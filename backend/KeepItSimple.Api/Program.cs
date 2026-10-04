using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddCors();

builder.Services.AddDbContext<KeepItSimpleDbContext>((serviceProvider, options) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("PostgresConnection");
    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException("Postgres connection string is not configured.");
    }

    options.UseNpgsql(connectionString);
});


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
    app.UseSwagger();
    app.UseSwaggerUI();

    // Ensure the database is created and migrated
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<KeepItSimpleDbContext>();
    dbContext.Database.EnsureCreated();
}

KeepItSimpleContext.InitContext(app);
app.UseHttpsRedirection();
app.MapControllers();
app.Run();