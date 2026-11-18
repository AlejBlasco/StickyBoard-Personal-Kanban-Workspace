using StickyBoard.Domain;

namespace StickyBoard.Application.Tasks;

public sealed record TaskDto(
    Guid Id, string Title, string? Description, TaskState Status, TaskPriority Priority,
    string Color, DateOnly? DueDate, long Position, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

public sealed record CreateTaskRequest(
    string? Title, string? Description, TaskState? Status, TaskPriority? Priority, string? Color, DateOnly? DueDate);

public sealed record UpdateTaskRequest(
    string? Title, string? Description, TaskPriority? Priority, string? Color, DateOnly? DueDate);

public sealed record MoveTaskRequest(TaskState? Status, int? Index);

/// <summary>Raw (unvalidated) query values as received from the API.</summary>
public sealed record TaskQuery(
    string? Q, string? Status, string? Priority, string? Due, DateOnly? DueFrom, DateOnly? DueTo, DateOnly? Today);

public enum DueFilter { Overdue, Today, Upcoming, None }

/// <summary>Validated filter handed to the repository.</summary>
public sealed record TaskFilter(
    string? Text, TaskState? Status, TaskPriority? Priority, DueFilter? Due,
    DateOnly? DueFrom, DateOnly? DueTo, DateOnly Today);

public sealed class ValidationException(IDictionary<string, string[]> errors) : Exception("Validation failed")
{
    public IDictionary<string, string[]> Errors { get; } = errors;
}

public sealed class NotFoundException(string message) : Exception(message);
