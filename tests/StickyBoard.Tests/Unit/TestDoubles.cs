using StickyBoard.Application.Tasks;
using StickyBoard.Domain;

namespace StickyBoard.Tests.Unit;

/// <summary>Controllable clock: fixed UTC instant and a fixed local time zone.</summary>
public sealed class FixedTimeProvider(DateTimeOffset utcNow, TimeSpan? localOffset = null) : TimeProvider
{
    private readonly TimeZoneInfo _zone = TimeZoneInfo.CreateCustomTimeZone(
        "test", localOffset ?? TimeSpan.Zero, "test", "test");

    public DateTimeOffset Now { get; set; } = utcNow;

    public override DateTimeOffset GetUtcNow() => Now;

    public override TimeZoneInfo LocalTimeZone => _zone;
}

/// <summary>In-memory repository. Tracks instances like EF does, so the service mutates the stored objects.</summary>
public sealed class FakeTaskRepository : ITaskRepository
{
    public List<TaskItem> Items { get; } = [];
    public TaskFilter? LastFilter { get; private set; }
    public int SaveCount { get; private set; }

    public Task<IReadOnlyList<TaskItem>> ListAsync(TaskFilter filter, CancellationToken ct)
    {
        LastFilter = filter;
        return Task.FromResult<IReadOnlyList<TaskItem>>(Items.OrderBy(t => t.Status).ThenBy(t => t.Position).ToList());
    }

    public Task<TaskItem?> GetAsync(Guid id, CancellationToken ct) =>
        Task.FromResult(Items.FirstOrDefault(t => t.Id == id));

    public Task<List<TaskItem>> GetColumnAsync(TaskState status, CancellationToken ct) =>
        Task.FromResult(Items.Where(t => t.Status == status).OrderBy(t => t.Position).ToList());

    public void Add(TaskItem task) => Items.Add(task);

    public void Remove(TaskItem task) => Items.Remove(task);

    public Task SaveChangesAsync(CancellationToken ct)
    {
        SaveCount++;
        return Task.CompletedTask;
    }
}
