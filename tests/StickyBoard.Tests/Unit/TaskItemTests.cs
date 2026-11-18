using StickyBoard.Domain;

namespace StickyBoard.Tests.Unit;

public class TaskItemTests
{
    private static readonly DateTimeOffset T0 = new(2026, 11, 18, 10, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset T1 = T0.AddHours(1);

    private static TaskItem NewTask(string title = "Titulo") =>
        TaskItem.Create(title, null, TaskState.Todo, TaskPriority.Medium, "lavender", null, 1024, T0);

    [Fact]
    public void Create_normalizes_text_and_sets_both_timestamps_to_now()
    {
        var t = TaskItem.Create("  Hola \t  mundo  ", "  desc  ", TaskState.InProgress, TaskPriority.High,
            "mint", new DateOnly(2026, 12, 1), 2048, T0);

        Assert.NotEqual(Guid.Empty, t.Id);
        Assert.Equal("Hola mundo", t.Title);
        Assert.Equal("desc", t.Description);
        Assert.Equal(TaskState.InProgress, t.Status);
        Assert.Equal(new DateOnly(2026, 12, 1), t.DueDate);
        Assert.Equal(2048, t.Position);
        Assert.Equal(T0, t.CreatedAt);
        Assert.Equal(T0, t.UpdatedAt);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   \n ")]
    public void Blank_description_becomes_null(string? description) =>
        Assert.Null(TaskItem.NormalizeDescription(description));

    [Fact]
    public void Edit_changes_fields_and_touches_updated_at_but_not_created_at()
    {
        var t = NewTask();
        t.Edit("  Nuevo   titulo ", "d", TaskPriority.Low, "rose", new DateOnly(2027, 1, 2), T1);

        Assert.Equal("Nuevo titulo", t.Title);
        Assert.Equal("d", t.Description);
        Assert.Equal(TaskPriority.Low, t.Priority);
        Assert.Equal("rose", t.Color);
        Assert.Equal(new DateOnly(2027, 1, 2), t.DueDate);
        Assert.Equal(T0, t.CreatedAt);
        Assert.Equal(T1, t.UpdatedAt);
    }

    [Fact]
    public void Edit_can_clear_the_due_date()
    {
        var t = TaskItem.Create("x", null, TaskState.Todo, TaskPriority.Low, "sky", new DateOnly(2026, 1, 1), 1024, T0);
        t.Edit("x", null, TaskPriority.Low, "sky", null, T1);
        Assert.Null(t.DueDate);
    }

    [Fact]
    public void MoveTo_with_same_status_and_position_does_not_touch_updated_at()
    {
        var t = NewTask();
        t.MoveTo(TaskState.Todo, 1024, T1);
        Assert.Equal(T0, t.UpdatedAt);
    }

    [Theory]
    [InlineData(TaskState.Todo, 2048)]
    [InlineData(TaskState.Done, 1024)]
    public void MoveTo_touches_updated_at_when_status_or_position_changes(TaskState status, long position)
    {
        var t = NewTask();
        t.MoveTo(status, position, T1);
        Assert.Equal(status, t.Status);
        Assert.Equal(position, t.Position);
        Assert.Equal(T1, t.UpdatedAt);
    }

    [Fact]
    public void A_done_task_can_return_to_any_other_column()
    {
        var t = TaskItem.Create("x", null, TaskState.Done, TaskPriority.Low, "sky", null, 1024, T0);
        t.MoveTo(TaskState.InProgress, 1024, T1);
        Assert.Equal(TaskState.InProgress, t.Status);
        t.MoveTo(TaskState.Todo, 1024, T1);
        Assert.Equal(TaskState.Todo, t.Status);
    }

    [Fact]
    public void Palette_has_the_agreed_colors_and_rejects_others()
    {
        Assert.Equal(["lavender", "mint", "peach", "sky", "lemon", "rose"], TaskColors.All);
        Assert.Equal("lavender", TaskColors.Default);
        Assert.True(TaskColors.IsValid("peach"));
        Assert.False(TaskColors.IsValid("Peach"));
        Assert.False(TaskColors.IsValid("#ff0000"));
    }
}
