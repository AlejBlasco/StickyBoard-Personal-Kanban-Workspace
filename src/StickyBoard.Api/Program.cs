using System.Text.Json;
using System.Text.Json.Serialization;
using StickyBoard.Api;
using StickyBoard.Application;
using StickyBoard.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 16 * 1024);

builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false)));
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddApplication().AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseMiddleware<OriginGuard>();

await app.Services.MigrateDatabaseAsync();

app.MapTaskEndpoints();

app.Run();

public partial class Program;
