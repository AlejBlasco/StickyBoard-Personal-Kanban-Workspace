using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using StickyBoard.Application.Tasks;

namespace StickyBoard.Api;

/// <summary>Maps exceptions to RFC 9457 Problem Details without leaking internals.</summary>
public sealed class ApiExceptionHandler(IProblemDetailsService problems, ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        ProblemDetails problem;
        switch (exception)
        {
            case ValidationException v:
                problem = new HttpValidationProblemDetails(v.Errors) { Status = 400, Title = "One or more validation errors occurred." };
                break;
            case NotFoundException n:
                problem = new ProblemDetails { Status = 404, Title = "Not found", Detail = n.Message };
                break;
            case BadHttpRequestException b:
                problem = new ProblemDetails { Status = b.StatusCode, Title = "Invalid request" };
                break;
            default:
                logger.LogError(exception, "Unhandled exception");
                problem = new ProblemDetails { Status = 500, Title = "An unexpected error occurred." };
                break;
        }

        context.Response.StatusCode = problem.Status!.Value;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = problem,
            Exception = exception,
        });
    }
}
