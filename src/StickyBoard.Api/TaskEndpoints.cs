using StickyBoard.Application.Tasks;

namespace StickyBoard.Api;

public static class TaskEndpoints
{
    public static void MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api/v1");

        api.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

        var tasks = api.MapGroup("/tasks");

        tasks.MapGet("/", async ([AsParameters] TaskQuery query, TaskService svc, CancellationToken ct) =>
            Results.Ok(await svc.ListAsync(query, ct)));

        tasks.MapGet("/{id:guid}", async (Guid id, TaskService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetAsync(id, ct)));

        tasks.MapPost("/", async (CreateTaskRequest req, TaskService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateAsync(req, ct);
            return Results.Created($"/api/v1/tasks/{created.Id}", created);
        });

        tasks.MapPut("/{id:guid}", async (Guid id, UpdateTaskRequest req, TaskService svc, CancellationToken ct) =>
            Results.Ok(await svc.UpdateAsync(id, req, ct)));

        tasks.MapDelete("/{id:guid}", async (Guid id, TaskService svc, CancellationToken ct) =>
        {
            await svc.DeleteAsync(id, ct);
            return Results.NoContent();
        });

        tasks.MapPatch("/{id:guid}/position", async (Guid id, MoveTaskRequest req, TaskService svc, CancellationToken ct) =>
            Results.Ok(await svc.MoveAsync(id, req, ct)));
    }
}
