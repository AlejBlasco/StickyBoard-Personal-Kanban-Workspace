using Microsoft.Extensions.DependencyInjection;
using StickyBoard.Application.Tasks;

namespace StickyBoard.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<TaskService>();
        return services;
    }
}
