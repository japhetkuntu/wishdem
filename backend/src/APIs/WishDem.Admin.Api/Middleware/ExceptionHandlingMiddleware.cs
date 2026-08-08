using System.Text.Json;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Middleware;

/// <summary>Translates a thrown WishDemException into the same ApiResponse envelope
/// every other endpoint returns, instead of letting it surface as a raw 500 or an
/// ASP.NET default problem-details page.</summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    // Matches ASP.NET's default controller-output casing so error responses use the same
    // camelCase field names as every successful ApiResponse<T>, instead of System.Text.Json's
    // PascalCase default.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (WishDemException ex)
        {
            // Service methods are expected to catch WishDemException themselves and return
            // an ApiResponse directly — this only fires for the rare case something threw
            // outside that layer (model binding, a filter, etc.).
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";
            var response = ApiResponseFactory.FromException<object>(ex);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception processing {Path}", context.Request.Path);
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            var response = ApiResponseFactory.InternalError<object>();
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
        }
    }
}
