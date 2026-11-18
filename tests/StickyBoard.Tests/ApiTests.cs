using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;

namespace StickyBoard.Tests;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"sb-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder) =>
        builder.UseSetting("ConnectionStrings:Default", $"Data Source={_dbPath}");

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        SqliteConnection.ClearAllPools();
        foreach (var f in Directory.GetFiles(Path.GetTempPath(), Path.GetFileName(_dbPath) + "*")) File.Delete(f);
    }
}

public sealed class ApiTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _http;

    public ApiTests(ApiFactory factory) => _http = factory.CreateClient();

    private async Task<JsonElement> CreateAsync(object body)
    {
        var res = await _http.PostAsJsonAsync("/api/v1/tasks", body);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return await res.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<JsonElement[]> ListAsync(string query = "") =>
        (await _http.GetFromJsonAsync<JsonElement[]>("/api/v1/tasks" + query))!;

    private static string Tag() => Guid.NewGuid().ToString("N")[..8];

    [Fact]
    public async Task Health_is_ok()
    {
        var res = await _http.GetAsync("/api/v1/health");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Create_applies_defaults_and_normalizes_title()
    {
        var t = await CreateAsync(new { title = "  Hola   mundo " });
        Assert.Equal("Hola mundo", t.GetProperty("title").GetString());
        Assert.Equal("todo", t.GetProperty("status").GetString());
        Assert.Equal("medium", t.GetProperty("priority").GetString());
        Assert.Equal("lavender", t.GetProperty("color").GetString());
    }

    [Theory]
    [InlineData("{\"title\":\"   \"}")]
    [InlineData("{\"title\":\"ok\",\"color\":\"neon\"}")]
    [InlineData("{\"title\":\"ok\",\"priority\":\"urgent\"}")]
    [InlineData("{\"title\":\"ok\",\"status\":1}")]
    public async Task Create_rejects_invalid_input_with_problem_details(string json)
    {
        var res = await _http.PostAsync("/api/v1/tasks", new StringContent(json, System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        Assert.Equal("application/problem+json", res.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Create_rejects_too_long_title()
    {
        var res = await _http.PostAsJsonAsync("/api/v1/tasks", new { title = new string('a', 121) });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Update_changes_editable_fields_and_delete_is_permanent()
    {
        var created = await CreateAsync(new { title = "A" });
        var id = created.GetProperty("id").GetString();

        var put = await _http.PutAsJsonAsync($"/api/v1/tasks/{id}",
            new { title = "B", description = "desc", priority = "high", color = "mint", dueDate = "2026-12-01" });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var updated = await put.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("high", updated.GetProperty("priority").GetString());
        Assert.Equal("2026-12-01", updated.GetProperty("dueDate").GetString());

        Assert.Equal(HttpStatusCode.NoContent, (await _http.DeleteAsync($"/api/v1/tasks/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _http.GetAsync($"/api/v1/tasks/{id}")).StatusCode);
    }

    [Fact]
    public async Task Move_reorders_within_column_and_between_columns_and_done_is_recoverable()
    {
        var tag = Tag();
        var a = await CreateAsync(new { title = $"{tag} a" });
        var b = await CreateAsync(new { title = $"{tag} b" });
        var c = await CreateAsync(new { title = $"{tag} c" });

        // c to the top of todo
        await Move(c, "todo", 0);
        Assert.Equal(["c", "a", "b"], await Titles(tag, "todo"));

        // a to done, then back to inProgress
        await Move(a, "done", 0);
        Assert.Equal(["a"], await Titles(tag, "done"));
        Assert.Equal(["c", "b"], await Titles(tag, "todo"));

        await Move(a, "inProgress", 99);
        Assert.Empty(await Titles(tag, "done"));
        Assert.Equal(["a"], await Titles(tag, "inProgress"));

        // positions in a column are unique
        var positions = (await ListAsync($"?q={tag}&status=todo")).Select(t => t.GetProperty("position").GetInt64()).ToArray();
        Assert.Equal(positions.Length, positions.Distinct().Count());
    }

    [Fact]
    public async Task Move_rejects_negative_index()
    {
        var t = await CreateAsync(new { title = "x" });
        var res = await _http.PatchAsJsonAsync($"/api/v1/tasks/{t.GetProperty("id").GetString()}/position", new { status = "todo", index = -1 });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Search_and_filters_combine()
    {
        var tag = Tag();
        await CreateAsync(new { title = $"{tag} alpha", priority = "high", dueDate = "2020-01-01" });
        await CreateAsync(new { title = "other", description = $"contains {tag}", priority = "low" });
        await CreateAsync(new { title = $"{tag} beta", priority = "high", dueDate = "2999-01-01" });

        Assert.Equal(3, (await ListAsync($"?q={tag}")).Length);
        Assert.Equal(2, (await ListAsync($"?q={tag}&priority=high")).Length);
        Assert.Single(await ListAsync($"?q={tag}&priority=high&due=overdue"));
        Assert.Single(await ListAsync($"?q={tag}&due=none"));
        Assert.Single(await ListAsync($"?q={tag}&dueFrom=2999-01-01&dueTo=2999-12-31"));
        Assert.Empty(await ListAsync($"?q={tag}&due=today&today=2030-01-01"));
    }

    [Fact]
    public async Task Search_treats_like_wildcards_literally()
    {
        var tag = Tag();
        await CreateAsync(new { title = $"{tag} 100%" });
        await CreateAsync(new { title = $"{tag} 100x" });
        Assert.Single(await ListAsync($"?q={tag} 100%25"));
    }

    [Fact]
    public async Task Invalid_filter_returns_400()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await _http.GetAsync("/api/v1/tasks?status=nope")).StatusCode);
    }

    private async Task Move(JsonElement task, string status, int index)
    {
        var res = await _http.PatchAsJsonAsync($"/api/v1/tasks/{task.GetProperty("id").GetString()}/position", new { status, index });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    private async Task<string[]> Titles(string tag, string status) =>
        (await ListAsync($"?q={tag}&status={status}")).Select(t => t.GetProperty("title").GetString()!.Split(' ')[1]).ToArray();
}

public sealed class OriginGuardTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _http;

    public OriginGuardTests(ApiFactory factory) => _http = factory.CreateClient();

    private static HttpRequestMessage Post(string? origin)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/tasks")
        {
            Content = JsonContent.Create(new { title = "x" }),
        };
        if (origin is not null) req.Headers.Add("Origin", origin);
        return req;
    }

    [Theory]
    [InlineData("https://evil.example")]
    [InlineData("http://localhost:9999")]
    [InlineData("null")]
    public async Task Rejects_state_changes_from_unlisted_origins(string origin)
    {
        var res = await _http.SendAsync(Post(origin));
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        Assert.Equal("application/problem+json", res.Content.Headers.ContentType?.MediaType);
    }

    [Theory]
    [InlineData("http://localhost:5173")]
    [InlineData("http://127.0.0.1:8080/")]
    [InlineData(null)]
    public async Task Allows_listed_or_absent_origin(string? origin)
    {
        var res = await _http.SendAsync(Post(origin));
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
    }

    [Fact]
    public async Task Reads_are_not_origin_restricted()
    {
        var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/tasks");
        req.Headers.Add("Origin", "https://evil.example");
        Assert.Equal(HttpStatusCode.OK, (await _http.SendAsync(req)).StatusCode);
    }

    [Fact]
    public async Task Unknown_host_is_rejected()
    {
        var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/health");
        req.Headers.Host = "evil.example";
        Assert.Equal(HttpStatusCode.BadRequest, (await _http.SendAsync(req)).StatusCode);
    }
}
