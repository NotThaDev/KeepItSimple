
using KeepItSimple.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Helpers;

public class KeepItSimpleDbContext(DbContextOptions<KeepItSimpleDbContext> options) : DbContext(options)
{
    public DbSet<Expense> Expenses => Set<Expense>();
}