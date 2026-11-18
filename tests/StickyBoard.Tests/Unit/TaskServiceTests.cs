using StickyBoard.Application.Tasks;
using StickyBoard.Domain;

namespace StickyBoard.Tests.Unit;

public class TaskServiceTests
{
    private static readonly DateTimeOffset T0 = new(2026, 11, 18, 10, 0, 0, TimeSpan.Zero);

    private readonly FakeTaskRepository _repo = new();
    private readonly FixedTimeProvider _clock = new(T0);
    private readonly TaskService _svc;

    public TaskServiceTests() => _svc = new TaskService(_repo, _clock);

    private static CreateTaskRequest Create(string title, TaskState? status = null) =>
        new(title, null, status, null, null, null);

    private Task<TaskDto> Add(string title, TaskState status = TaskState.Todo) =>
        _svc.CreateAsync(Create(title, status), default);

    private async Task<string[]> Column(TaskState status) =>
        [.. (await _repo.GetColumnAsync(status, default)).Select(t => t.Title)];

    private static async Task<ValidationException> Invalid(Func<Task> act) =>
        await Assert.ThrowsAsync<ValidationException>(act);

    // ---- create ----

    [Fact]
    public async Task Create_uses_defaults_and_persists()
    {
        var dto = await _svc.CreateAsync(Create("Demo"), default);

        Assert.Equal(TaskState.Todo, dto.Status);
        Assert.Equal(TaskPriority.Medium, dto.Priority);
        Assert.Equal("lavender", dto.Color);
        Assert.Null(dto.DueDate);
        Assert.Equal(T0, dto.CreatedAt);
        Assert.Single(_repo.Items);
        Assert.Equal(1, _repo.SaveCount);
    }

    [Fact]
    public async Task Create_appends_to_the_end_of_the_target_column_with_stable_positions()
    {
        var a = await Add("a");
        var b = await Add("b");
        var other = await Add("x", TaskState.Done);

        Assert.Equal(TaskLimits.PositionStep, a.Position);
        Assert.Equal(2 * TaskLimits.PositionStep, b.Position);
        Assert.Equal(TaskLimits.PositionStep, other.Position);
    }

    [Fact]
    public async Task Create_keeps_all_optional_fields()
    {
        var dto = await _svc.CreateAsync(
            new("  T ", " d ", TaskState.InProgress, TaskPriority.High, "rose", new DateOnly(2026, 12, 24)), default);

        Assert.Equal("T", dto.Title);
        Assert.Equal("d", dto.Description);
        Assert.Equal(TaskState.InProgress, dto.Status);
        Assert.Equal(TaskPriority.High, dto.Priority);
        Assert.Equal("rose", dto.Color);
        Assert.Equal(new DateOnly(2026, 12, 24), dto.DueDate);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  \t ")]
    public async Task Create_rejects_blank_title(string? title)
    {
        var ex = await Invalid(() => _svc.CreateAsync(Create(title!), default));
        Assert.Contains("title", ex.Errors.Keys);
        Assert.Empty(_repo.Items);
        Assert.Equal(0, _repo.SaveCount);
    }

    [Fact]
    public async Task Title_limit_is_measured_after_normalization()
    {
        await _svc.CreateAsync(Create(new string('a', TaskLimits.TitleMax)), default);
        await _svc.CreateAsync(Create("  " + new string('b', TaskLimits.TitleMax) + "   "), default);
        await Invalid(() => _svc.CreateAsync(Create(new string('a', TaskLimits.TitleMax + 1)), default));
    }

    [Fact]
    public async Task Description_limit_is_enforced()
    {
        await _svc.CreateAsync(new("t", new string('d', TaskLimits.DescriptionMax), null, null, null, null), default);
        var ex = await Invalid(() => _svc.CreateAsync(
            new("t", new string('d', TaskLimits.DescriptionMax + 1), null, null, null, null), default));
        Assert.Contains("description", ex.Errors.Keys);
    }

    [Theory]
    [InlineData("neon")]
    [InlineData("Lavender")]
    [InlineData("")]
    public async Task Create_rejects_colors_outside_the_palette(string color)
    {
        var ex = await Invalid(() => _svc.CreateAsync(new("t", null, null, null, color, null), default));
        Assert.Contains("color", ex.Errors.Keys);
    }

    [Fact]
    public async Task Create_reports_every_invalid_field_at_once()
    {
        var ex = await Invalid(() => _svc.CreateAsync(
            new("", new string('d', TaskLimits.DescriptionMax + 1), null, null, "neon", null), default));
        Assert.Equal(["color", "description", "title"], ex.Errors.Keys.Order());
    }

    // ---- update ----

    [Fact]
    public async Task Update_changes_editable_fields_and_updated_at_but_not_status_or_position()
    {
        var created = await Add("a", TaskState.InProgress);
        _clock.Now = T0.AddMinutes(5);

        var dto = await _svc.UpdateAsync(created.Id,
            new("b", "desc", TaskPriority.High, "mint", new DateOnly(2027, 1, 1)), default);

        Assert.Equal("b", dto.Title);
        Assert.Equal(TaskPriority.High, dto.Priority);
        Assert.Equal("mint", dto.Color);
        Assert.Equal(TaskState.InProgress, dto.Status);
        Assert.Equal(created.Position, dto.Position);
        Assert.Equal(T0, dto.CreatedAt);
        Assert.Equal(T0.AddMinutes(5), dto.UpdatedAt);
    }

    [Fact]
    public async Task Update_keeps_priority_when_omitted_and_resets_color_to_default()
    {
        var created = await _svc.CreateAsync(new("a", null, null, TaskPriority.Low, "rose", null), default);
        var dto = await _svc.UpdateAsync(created.Id, new("a", null, null, null, null), default);

        Assert.Equal(TaskPriority.Low, dto.Priority);
        Assert.Equal("lavender", dto.Color);
    }

    [Fact]
    public async Task Update_validates_and_does_not_save_on_error()
    {
        var created = await Add("a");
        var saves = _repo.SaveCount;

        await Invalid(() => _svc.UpdateAsync(created.Id, new("", null, null, null, null), default));

        Assert.Equal(saves, _repo.SaveCount);
        Assert.Equal("a", _repo.Items[0].Title);
    }

    [Fact]
    public async Task Update_unknown_id_is_not_found() =>
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _svc.UpdateAsync(Guid.NewGuid(), new("a", null, null, null, null), default));

    // ---- get / delete ----

    [Fact]
    public async Task Get_unknown_id_is_not_found() =>
        await Assert.ThrowsAsync<NotFoundException>(() => _svc.GetAsync(Guid.NewGuid(), default));

    [Fact]
    public async Task Delete_removes_the_task_permanently()
    {
        var a = await Add("a");
        await Add("b");

        await _svc.DeleteAsync(a.Id, default);

        Assert.Equal(["b"], await Column(TaskState.Todo));
        await Assert.ThrowsAsync<NotFoundException>(() => _svc.GetAsync(a.Id, default));
    }

    [Fact]
    public async Task Delete_unknown_id_is_not_found() =>
        await Assert.ThrowsAsync<NotFoundException>(() => _svc.DeleteAsync(Guid.NewGuid(), default));

    // ---- move ----

    [Fact]
    public async Task Move_reorders_within_a_column()
    {
        await Add("a");
        await Add("b");
        var c = await Add("c");

        await _svc.MoveAsync(c.Id, new(TaskState.Todo, 0), default);
        Assert.Equal(["c", "a", "b"], await Column(TaskState.Todo));

        await _svc.MoveAsync(c.Id, new(TaskState.Todo, 1), default);
        Assert.Equal(["a", "c", "b"], await Column(TaskState.Todo));

        await _svc.MoveAsync(c.Id, new(TaskState.Todo, 2), default);
        Assert.Equal(["a", "b", "c"], await Column(TaskState.Todo));
    }

    [Fact]
    public async Task Move_across_columns_inserts_at_index_and_closes_the_gap_in_the_source()
    {
        var a = await Add("a");
        await Add("b");
        await Add("x", TaskState.InProgress);
        await Add("y", TaskState.InProgress);

        await _svc.MoveAsync(a.Id, new(TaskState.InProgress, 1), default);

        Assert.Equal(["b"], await Column(TaskState.Todo));
        Assert.Equal(["x", "a", "y"], await Column(TaskState.InProgress));
    }

    [Theory]
    [InlineData(2, "x")]
    [InlineData(1000, "x")]
    public async Task Move_clamps_an_index_past_the_end_to_the_end(int index, string last)
    {
        var a = await Add("a");
        await Add(last, TaskState.Done);
        var dto = await _svc.MoveAsync(a.Id, new(TaskState.Done, index), default);

        Assert.Equal(["x", "a"], await Column(TaskState.Done));
        Assert.Equal(2 * TaskLimits.PositionStep, dto.Position);
    }

    [Fact]
    public async Task Move_renumbers_the_destination_and_keeps_the_source_ordered_and_unique()
    {
        var items = new List<TaskDto>();
        foreach (var t in new[] { "a", "b", "c", "d" }) items.Add(await Add(t));
        await _svc.MoveAsync(items[1].Id, new(TaskState.Done, 0), default);
        await _svc.MoveAsync(items[3].Id, new(TaskState.Done, 0), default);
        await _svc.MoveAsync(items[0].Id, new(TaskState.Done, 1), default);

        // Destination: renumbered in steps of PositionStep
        var done = (await _repo.GetColumnAsync(TaskState.Done, default)).Select(t => t.Position).ToArray();
        Assert.Equal(Enumerable.Range(1, done.Length).Select(i => i * TaskLimits.PositionStep), done);

        // Source: gaps are allowed, but order is preserved and positions never collide
        var todo = (await _repo.GetColumnAsync(TaskState.Todo, default)).Select(t => t.Position).ToArray();
        Assert.Equal(todo.Order(), todo);
        Assert.Equal(todo.Length, todo.Distinct().Count());
    }

    [Fact]
    public async Task Move_touches_updated_at_only_for_tasks_whose_place_changed()
    {
        var a = await Add("a");
        var b = await Add("b");
        var c = await Add("c");
        _clock.Now = T0.AddHours(1);

        await _svc.MoveAsync(c.Id, new(TaskState.Todo, 1), default); // a, c, b

        DateTimeOffset Updated(Guid id) => _repo.Items.Single(t => t.Id == id).UpdatedAt;
        Assert.Equal(T0, Updated(a.Id));
        Assert.Equal(T0.AddHours(1), Updated(b.Id));
        Assert.Equal(T0.AddHours(1), Updated(c.Id));
    }

    [Fact]
    public async Task Moving_to_the_same_place_changes_nothing()
    {
        await Add("a");
        var b = await Add("b");
        _clock.Now = T0.AddHours(1);

        var dto = await _svc.MoveAsync(b.Id, new(TaskState.Todo, 1), default);

        Assert.Equal(["a", "b"], await Column(TaskState.Todo));
        Assert.Equal(T0, dto.UpdatedAt);
    }

    [Fact]
    public async Task A_completed_task_can_be_recovered_to_another_column()
    {
        var done = await Add("hecha", TaskState.Done);
        await Add("pendiente");

        var dto = await _svc.MoveAsync(done.Id, new(TaskState.Todo, 0), default);

        Assert.Equal(TaskState.Todo, dto.Status);
        Assert.Equal(["hecha", "pendiente"], await Column(TaskState.Todo));
        Assert.Empty(await Column(TaskState.Done));
    }

    [Fact]
    public async Task Move_validates_status_and_index()
    {
        var a = await Add("a");

        var missing = await Invalid(() => _svc.MoveAsync(a.Id, new(null, null), default));
        Assert.Equal(["index", "status"], missing.Errors.Keys.Order());

        var negative = await Invalid(() => _svc.MoveAsync(a.Id, new(TaskState.Todo, -1), default));
        Assert.Equal(["index"], negative.Errors.Keys);
    }

    [Fact]
    public async Task Move_unknown_id_is_not_found() =>
        await Assert.ThrowsAsync<NotFoundException>(() =>
            _svc.MoveAsync(Guid.NewGuid(), new(TaskState.Todo, 0), default));

    // ---- list / filter parsing ----

    private async Task<TaskFilter> Filter(TaskQuery query)
    {
        await _svc.ListAsync(query, default);
        return _repo.LastFilter!;
    }

    private static TaskQuery Query(string? q = null, string? status = null, string? priority = null, string? due = null,
        DateOnly? from = null, DateOnly? to = null, DateOnly? today = null) => new(q, status, priority, due, from, to, today);

    [Fact]
    public async Task List_without_filters_passes_an_empty_filter()
    {
        var f = await Filter(Query());
        Assert.Null(f.Text);
        Assert.Null(f.Status);
        Assert.Null(f.Priority);
        Assert.Null(f.Due);
        Assert.Null(f.DueFrom);
        Assert.Null(f.DueTo);
    }

    [Fact]
    public async Task List_parses_every_filter_case_insensitively_and_trims_text()
    {
        var f = await Filter(Query("  informe ", "INPROGRESS", "High", "Upcoming",
            new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 30)));

        Assert.Equal("informe", f.Text);
        Assert.Equal(TaskState.InProgress, f.Status);
        Assert.Equal(TaskPriority.High, f.Priority);
        Assert.Equal(DueFilter.Upcoming, f.Due);
        Assert.Equal(new DateOnly(2026, 11, 1), f.DueFrom);
        Assert.Equal(new DateOnly(2026, 11, 30), f.DueTo);
    }

    [Fact]
    public async Task List_treats_a_blank_text_as_no_text() =>
        Assert.Null((await Filter(Query(q: "   "))).Text);

    [Theory]
    [InlineData("status", "nope")]
    [InlineData("status", "1")]
    [InlineData("priority", "urgent")]
    [InlineData("priority", "0")]
    [InlineData("due", "tomorrow")]
    public async Task List_rejects_unknown_or_numeric_enum_values(string field, string value)
    {
        var query = field switch
        {
            "status" => Query(status: value),
            "priority" => Query(priority: value),
            _ => Query(due: value),
        };
        var ex = await Invalid(() => _svc.ListAsync(query, default));
        Assert.Contains(field, ex.Errors.Keys);
    }

    [Fact]
    public async Task List_rejects_an_inverted_date_range() =>
        await Invalid(() => _svc.ListAsync(Query(from: new DateOnly(2026, 12, 1), to: new DateOnly(2026, 11, 1)), default));

    [Fact]
    public async Task List_uses_the_client_today_when_given()
    {
        var f = await Filter(Query(today: new DateOnly(2030, 5, 6)));
        Assert.Equal(new DateOnly(2030, 5, 6), f.Today);
    }

    [Fact]
    public async Task List_defaults_today_to_the_local_calendar_date_not_utc()
    {
        // 20:00 UTC on the 18th is already the 19th at UTC+10
        var svc = new TaskService(_repo, new FixedTimeProvider(new DateTimeOffset(2026, 11, 18, 20, 0, 0, TimeSpan.Zero), TimeSpan.FromHours(10)));
        await svc.ListAsync(Query(), default);
        Assert.Equal(new DateOnly(2026, 11, 19), _repo.LastFilter!.Today);

        var utc = new TaskService(_repo, new FixedTimeProvider(new DateTimeOffset(2026, 11, 18, 20, 0, 0, TimeSpan.Zero)));
        await utc.ListAsync(Query(), default);
        Assert.Equal(new DateOnly(2026, 11, 18), _repo.LastFilter!.Today);
    }

    [Fact]
    public async Task List_returns_dtos_ordered_by_column_then_position()
    {
        await Add("a");
        await Add("x", TaskState.Done);
        await Add("b");

        var list = await _svc.ListAsync(Query(), default);

        Assert.Equal(["a", "b", "x"], list.Select(t => t.Title));
    }
}
