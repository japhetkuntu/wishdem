using WishDem.Customer.Api.Middleware;

namespace WishDem.Customer.Api.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseWishDemExceptionHandling(this IApplicationBuilder app) =>
        app.UseMiddleware<ExceptionHandlingMiddleware>();
}
