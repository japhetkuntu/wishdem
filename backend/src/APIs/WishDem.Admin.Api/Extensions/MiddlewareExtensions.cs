using WishDem.Admin.Api.Middleware;

namespace WishDem.Admin.Api.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseWishDemExceptionHandling(this IApplicationBuilder app) =>
        app.UseMiddleware<ExceptionHandlingMiddleware>();
}
