namespace KeepItSimple.Api.Helpers;

public class KeepItSimpleContext
{
    private static KeepItSimpleContext? _context;
    private IServiceProvider? _serviceProvider;
    private static readonly object _lock = new();
    public static KeepItSimpleContext Context
    {
        get
        {
            if (_context == null)
            {
                throw new InvalidOperationException("KeepItSimpleContext has not been initialized. Call Initialize() first.");
            }
            return _context;
        }
    }

    public static void InitContext(WebApplication app)
    {
        if (_context == null)
        {
            lock (_lock)
            {
                _context ??= new KeepItSimpleContext
                {
                    _serviceProvider = app.Services
                };

            }
        }
    }

    public T WithDbContext<T>(Func<KeepItSimpleDbContext, T> action)
    {
        if (_serviceProvider == null)
        {
            throw new InvalidOperationException("Service provider is not initialized.");
        }

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<KeepItSimpleDbContext>();
        return action(dbContext);
    }

    public async Task<T> WithDbContextAsync<T>(Func<KeepItSimpleDbContext, Task<T>> action)
    {
        if (_serviceProvider == null)
        {
            throw new InvalidOperationException("Service provider is not initialized.");
        }

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<KeepItSimpleDbContext>();
        return await action(dbContext);
    }

}