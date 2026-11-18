using Microsoft.EntityFrameworkCore;
using StickyBoard.Application.Tasks;
using StickyBoard.Domain;

namespace StickyBoard.Infrastructure.Persistence;

public sealed class TaskRepository(StickyBoardDbContext db) : ITaskRepository
{
    public async Task<IReadOnlyList<TaskItem>> ListAsync(TaskFilter f, CancellationToken ct)
    {
        IQueryable<TaskItem> query = db.Tasks.AsNoTracking();

        if (f.Text is not null)
        {
            var pattern = "%" + f.Text.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%";
            query = query.Where(t => EF.Functions.Like(t.Title, pattern, "\\")
                                     || (t.Description != null && EF.Functions.Like(t.Description, pattern, "\\")));
        }
        if (f.Status is { } status) query = query.Where(t => t.Status == status);
        if (f.Priority is { } priority) query = query.Where(t => t.Priority == priority);

        if (f.Due is { } due)
        {
            var today = f.Today;
            var horizon = today.AddDays(7);
            query = due switch
            {
                DueFilter.Overdue => query.Where(t => t.DueDate < today && t.Status != TaskState.Done),
                DueFilter.Today => query.Where(t => t.DueDate == today),
                DueFilter.Upcoming => query.Where(t => t.DueDate > today && t.DueDate <= horizon),
                _ => query.Where(t => t.DueDate == null),
            };
        }
        if (f.DueFrom is { } from) query = query.Where(t => t.DueDate >= from);
        if (f.DueTo is { } to) query = query.Where(t => t.DueDate <= to);

        return await query.OrderBy(t => t.Status).ThenBy(t => t.Position).ToListAsync(ct);
    }

    public Task<TaskItem?> GetAsync(Guid id, CancellationToken ct) =>
        db.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);

    public Task<List<TaskItem>> GetColumnAsync(TaskState status, CancellationToken ct) =>
        db.Tasks.Where(t => t.Status == status).OrderBy(t => t.Position).ToListAsync(ct);

    public void Add(TaskItem task) => db.Tasks.Add(task);

    public void Remove(TaskItem task) => db.Tasks.Remove(task);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
