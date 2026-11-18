using StickyBoard.Domain;

namespace StickyBoard.Application.Tasks;

public sealed class TaskService(ITaskRepository repository, TimeProvider clock)
{
    public async Task<IReadOnlyList<TaskDto>> ListAsync(TaskQuery query, CancellationToken ct)
    {
        var filter = BuildFilter(query);
        var tasks = await repository.ListAsync(filter, ct);
        return tasks.Select(ToDto).ToList();
    }

    public async Task<TaskDto> GetAsync(Guid id, CancellationToken ct) =>
        ToDto(await FindAsync(id, ct));

    public async Task<TaskDto> CreateAsync(CreateTaskRequest request, CancellationToken ct)
    {
        var errors = new Errors();
        var title = ValidateTitle(request.Title, errors);
        var description = ValidateDescription(request.Description, errors);
        var color = ValidateColor(request.Color, errors);
        errors.ThrowIfAny();

        var status = request.Status ?? TaskState.Todo;
        var column = await repository.GetColumnAsync(status, ct);
        var position = (column.Count == 0 ? 0 : column[^1].Position) + TaskLimits.PositionStep;

        var task = TaskItem.Create(title!, description, status, request.Priority ?? TaskPriority.Medium,
            color, request.DueDate, position, clock.GetUtcNow());
        repository.Add(task);
        await repository.SaveChangesAsync(ct);
        return ToDto(task);
    }

    public async Task<TaskDto> UpdateAsync(Guid id, UpdateTaskRequest request, CancellationToken ct)
    {
        var task = await FindAsync(id, ct);
        var errors = new Errors();
        var title = ValidateTitle(request.Title, errors);
        var description = ValidateDescription(request.Description, errors);
        var color = ValidateColor(request.Color, errors);
        errors.ThrowIfAny();

        task.Edit(title!, description, request.Priority ?? task.Priority, color, request.DueDate, clock.GetUtcNow());
        await repository.SaveChangesAsync(ct);
        return ToDto(task);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var task = await FindAsync(id, ct);
        repository.Remove(task);
        await repository.SaveChangesAsync(ct);
    }

    public async Task<TaskDto> MoveAsync(Guid id, MoveTaskRequest request, CancellationToken ct)
    {
        var errors = new Errors();
        if (request.Status is null) errors.Add("status", "Status is required.");
        if (request.Index is null) errors.Add("index", "Index is required.");
        else if (request.Index < 0) errors.Add("index", "Index must be zero or greater.");
        errors.ThrowIfAny();

        var task = await FindAsync(id, ct);
        var status = request.Status!.Value;

        var column = await repository.GetColumnAsync(status, ct);
        column.RemoveAll(t => t.Id == task.Id);
        column.Insert(Math.Min(request.Index!.Value, column.Count), task);

        var now = clock.GetUtcNow();
        for (var i = 0; i < column.Count; i++)
            column[i].MoveTo(status, (i + 1) * TaskLimits.PositionStep, now);

        await repository.SaveChangesAsync(ct);
        return ToDto(task);
    }

    private async Task<TaskItem> FindAsync(Guid id, CancellationToken ct) =>
        await repository.GetAsync(id, ct) ?? throw new NotFoundException($"Task '{id}' was not found.");

    private TaskFilter BuildFilter(TaskQuery q)
    {
        var errors = new Errors();
        TaskState? status = null;
        TaskPriority? priority = null;
        DueFilter? due = null;

        if (!string.IsNullOrWhiteSpace(q.Status))
        {
            if (TryParseEnum<TaskState>(q.Status, out var s)) status = s;
            else errors.Add("status", "Must be one of: todo, inProgress, done.");
        }
        if (!string.IsNullOrWhiteSpace(q.Priority))
        {
            if (TryParseEnum<TaskPriority>(q.Priority, out var p)) priority = p;
            else errors.Add("priority", "Must be one of: low, medium, high.");
        }
        if (!string.IsNullOrWhiteSpace(q.Due))
        {
            if (TryParseEnum<DueFilter>(q.Due, out var d)) due = d;
            else errors.Add("due", "Must be one of: overdue, today, upcoming, none.");
        }
        if (q.DueFrom > q.DueTo) errors.Add("dueFrom", "dueFrom must not be after dueTo.");
        errors.ThrowIfAny();

        var text = string.IsNullOrWhiteSpace(q.Q) ? null : q.Q.Trim();
        var today = q.Today ?? DateOnly.FromDateTime(clock.GetLocalNow().DateTime);
        return new TaskFilter(text, status, priority, due, q.DueFrom, q.DueTo, today);
    }

    // Enum.TryParse accepts numbers and arbitrary casing; only accept defined names (case-insensitive).
    private static bool TryParseEnum<T>(string value, out T result) where T : struct, Enum =>
        Enum.TryParse(value.Trim(), ignoreCase: true, out result)
        && !char.IsDigit(value.Trim()[0]) && Enum.IsDefined(result);

    private static string? ValidateTitle(string? title, Errors errors)
    {
        var normalized = title is null ? "" : TaskItem.NormalizeTitle(title);
        if (normalized.Length == 0) errors.Add("title", "Title is required.");
        else if (normalized.Length > TaskLimits.TitleMax) errors.Add("title", $"Title must be at most {TaskLimits.TitleMax} characters.");
        return normalized;
    }

    private static string? ValidateDescription(string? description, Errors errors)
    {
        var normalized = TaskItem.NormalizeDescription(description);
        if (normalized?.Length > TaskLimits.DescriptionMax)
            errors.Add("description", $"Description must be at most {TaskLimits.DescriptionMax} characters.");
        return normalized;
    }

    private static string ValidateColor(string? color, Errors errors)
    {
        if (color is null) return TaskColors.Default;
        if (!TaskColors.IsValid(color))
            errors.Add("color", $"Color must be one of: {string.Join(", ", TaskColors.All)}.");
        return color;
    }

    private static TaskDto ToDto(TaskItem t) => new(
        t.Id, t.Title, t.Description, t.Status, t.Priority, t.Color, t.DueDate, t.Position, t.CreatedAt, t.UpdatedAt);

    private sealed class Errors
    {
        private readonly Dictionary<string, List<string>> _items = [];

        public void Add(string field, string message)
        {
            if (!_items.TryGetValue(field, out var list)) _items[field] = list = [];
            list.Add(message);
        }

        public void ThrowIfAny()
        {
            if (_items.Count > 0)
                throw new ValidationException(_items.ToDictionary(kv => kv.Key, kv => kv.Value.ToArray()));
        }
    }
}
