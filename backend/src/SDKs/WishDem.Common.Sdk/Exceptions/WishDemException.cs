namespace WishDem.Common.Sdk.Exceptions;

/// <summary>Base type for exceptions that should be translated into a specific HTTP status
/// by the API's exception-handling middleware, rather than surfacing as a raw 500.</summary>
public class WishDemException(string message, int statusCode = 400) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public sealed class NotFoundException(string message) : WishDemException(message, statusCode: 404);

public sealed class UnauthorizedException(string message) : WishDemException(message, statusCode: 401);

public sealed class ConflictException(string message) : WishDemException(message, statusCode: 409);
