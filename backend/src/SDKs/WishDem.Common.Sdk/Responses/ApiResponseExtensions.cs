namespace WishDem.Common.Sdk.Responses;

/// <summary>Fluent success-response builders, used at the end of a service method:
/// `return result.ToOkApiResponse("Wish created");`</summary>
public static class ApiResponseExtensions
{
    public static IApiResponse<T> ToOkApiResponse<T>(this T data, string message = "Success", string subCode = "0") =>
        new ApiResponse<T>(message, 200, data, subCode);

    public static IApiResponse<T> ToCreatedApiResponse<T>(this T data, string message = "Created", string subCode = "0") =>
        new ApiResponse<T>(message, 201, data, subCode);
}

/// <summary>Failure-response builders for the branches of a service method that didn't
/// succeed — used directly (`ApiResponseFactory.NotFound&lt;WishResponse&gt;("...")`) since
/// there's no success value to hang an extension method off of.</summary>
public static class ApiResponseFactory
{
    public static IApiResponse<T> BadRequest<T>(string message = "Bad Request", string subCode = "0", IEnumerable<ErrorResponse>? errors = null) =>
        new ApiResponse<T>(message, 400, default, subCode, errors);

    public static IApiResponse<T> Unauthorized<T>(string message = "Unauthorized", string subCode = "0") =>
        new ApiResponse<T>(message, 401, default, subCode);

    public static IApiResponse<T> Forbidden<T>(string message = "Forbidden", string subCode = "0") =>
        new ApiResponse<T>(message, 403, default, subCode);

    public static IApiResponse<T> NotFound<T>(string message = "Not Found", string subCode = "0") =>
        new ApiResponse<T>(message, 404, default, subCode);

    public static IApiResponse<T> Conflict<T>(string message = "Conflict", string subCode = "0") =>
        new ApiResponse<T>(message, 409, default, subCode);

    public static IApiResponse<T> TooManyRequests<T>(string message = "Too Many Requests", string subCode = "0") =>
        new ApiResponse<T>(message, 429, default, subCode);

    public static IApiResponse<T> ValidationFail<T>(IEnumerable<ErrorResponse> errors, string message = "One or more fields are invalid.") =>
        new ApiResponse<T>(message, 422, default, "0", errors);

    public static IApiResponse<T> InternalError<T>(string message = "Something went wrong. Please try again.") =>
        new ApiResponse<T>(message, 500);

    public static IApiResponse<T> FromException<T>(WishDem.Common.Sdk.Exceptions.WishDemException ex) =>
        new ApiResponse<T>(ex.Message, ex.StatusCode);
}
