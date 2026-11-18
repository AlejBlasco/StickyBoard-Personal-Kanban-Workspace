using Microsoft.AspNetCore.Mvc;

namespace StickyBoard.Api;

/// <summary>
/// Rejects state-changing requests whose Origin header is not explicitly allowed.
/// Requests without an Origin header (curl, same-origin tooling) are not browser cross-site requests and pass.
/// This is defence in depth against CSRF / DNS-rebinding from web pages; it is not authentication.
/// </summary>
public sealed class OriginGuard(RequestDelegate next, IConfiguration config)
{
    private static readonly HashSet<string> SafeMethods = [HttpMethods.Get, HttpMethods.Head, HttpMethods.Options];

    private readonly HashSet<string> _allowed = new(
        (config.GetSection("Security:AllowedOrigins").Get<string[]>() ?? [])
            .Select(o => o.TrimEnd('/')),
        StringComparer.OrdinalIgnoreCase);

    public async Task InvokeAsync(HttpContext context)
    {
        var origin = context.Request.Headers.Origin.ToString();
        if (!SafeMethods.Contains(context.Request.Method) && origin.Length > 0 && !_allowed.Contains(origin.TrimEnd('/')))
        {
            var problems = context.RequestServices.GetRequiredService<IProblemDetailsService>();
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await problems.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = new ProblemDetails { Status = 403, Title = "Origin not allowed" },
            });
            return;
        }

        await next(context);
    }
}
