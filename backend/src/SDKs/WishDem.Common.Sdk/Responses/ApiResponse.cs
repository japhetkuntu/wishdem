namespace WishDem.Common.Sdk.Responses;

/// <summary>Uniform envelope every controller action returns, success or failure. Controllers
/// pass this straight through via `StatusCode(response.Code, response)` — the HTTP status
/// always mirrors Code, so there's a single source of truth for "what happened".</summary>
public interface IApiResponse<out T>
{
    string Message { get; }
    int Code { get; }
    string SubCode { get; }
    T? Data { get; }
    IEnumerable<ErrorResponse>? Errors { get; }
}

public sealed record ApiResponse<T>(
    string Message,
    int Code,
    T? Data = default,
    string SubCode = "0",
    IEnumerable<ErrorResponse>? Errors = default) : IApiResponse<T>;

/// <summary>A single field-level validation failure, e.g. from FluentValidation.</summary>
public sealed record ErrorResponse(string Field, string ErrorMessage);
