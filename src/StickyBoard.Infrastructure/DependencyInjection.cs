using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StickyBoard.Application.Tasks;
using StickyBoard.Infrastructure.Persistence;

namespace StickyBoard.Infrastructure;

public static class DependencyInjection
{
    public const string DefaultConnectionString = "Data Source=data/stickyboard.db";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("Default") ?? DefaultConnectionString;
        EnsureDirectory(connectionString);
        services.AddDbContext<StickyBoardDbContext>(o => o.UseSqlite(connectionString));
        services.AddScoped<ITaskRepository, TaskRepository>();
        return services;
    }

    public static async Task MigrateDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<StickyBoardDbContext>().Database.MigrateAsync();
    }

    private static void EnsureDirectory(string connectionString)
    {
        var dataSource = new SqliteConnectionStringBuilder(connectionString).DataSource;
        var dir = string.IsNullOrEmpty(dataSource) ? null : Path.GetDirectoryName(Path.GetFullPath(dataSource));
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
    }
}
