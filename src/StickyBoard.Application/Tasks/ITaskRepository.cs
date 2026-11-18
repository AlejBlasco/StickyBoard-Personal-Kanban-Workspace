using StickyBoard.Domain;

namespace StickyBoard.Application.Tasks;

public interface ITaskRepository
{
    Task<IReadOnlyList<TaskItem>> ListAsync(TaskFilter filter, CancellationToken ct);
    Task<TaskItem?> GetAsync(Guid id, CancellationToken ct);

    /// <summary>Tracked tasks of a column ordered by position.</summary>
    Task<List<TaskItem>> GetColumnAsync(TaskState status, CancellationToken ct);

    void Add(TaskItem task);
    void Remove(TaskItem task);
    Task SaveChangesAsync(CancellationToken ct);
}
