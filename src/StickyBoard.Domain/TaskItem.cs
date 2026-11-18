using System.Text.RegularExpressions;

namespace StickyBoard.Domain;

public enum TaskState { Todo, InProgress, Done }

public enum TaskPriority { Low, Medium, High }

public static class TaskLimits
{
    public const int TitleMax = 120;
    public const int DescriptionMax = 2000;
    public const long PositionStep = 1024;
}

public static class TaskColors
{
    public const string Default = "lavender";

    public static readonly IReadOnlyList<string> All = ["lavender", "mint", "peach", "sky", "lemon", "rose"];

    public static bool IsValid(string color) => All.Contains(color);
}

public sealed partial class TaskItem
{
    private TaskItem() { }

    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public TaskState Status { get; private set; }
    public TaskPriority Priority { get; private set; }
    public string Color { get; private set; } = TaskColors.Default;
    public DateOnly? DueDate { get; private set; }
    public long Position { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public static TaskItem Create(
        string title, string? description, TaskState status, TaskPriority priority,
        string color, DateOnly? dueDate, long position, DateTimeOffset now) => new()
        {
            Id = Guid.NewGuid(),
            Title = NormalizeTitle(title),
            Description = NormalizeDescription(description),
            Status = status,
            Priority = priority,
            Color = color,
            DueDate = dueDate,
            Position = position,
            CreatedAt = now,
            UpdatedAt = now,
        };

    public void Edit(string title, string? description, TaskPriority priority, string color, DateOnly? dueDate, DateTimeOffset now)
    {
        Title = NormalizeTitle(title);
        Description = NormalizeDescription(description);
        Priority = priority;
        Color = color;
        DueDate = dueDate;
        UpdatedAt = now;
    }

    /// <summary>Sets column and position; touches UpdatedAt only if something changed.</summary>
    public void MoveTo(TaskState status, long position, DateTimeOffset now)
    {
        if (Status == status && Position == position) return;
        Status = status;
        Position = position;
        UpdatedAt = now;
    }

    public static string NormalizeTitle(string title) => WhitespaceRun().Replace(title, " ").Trim();

    public static string? NormalizeDescription(string? description)
    {
        var trimmed = description?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRun();
}
