using FluentAssertions;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using Xunit;

namespace WishDem.Common.Sdk.Tests.Responses;

public class ApiResponseExtensionsTests
{
    [Fact]
    public void ToOkApiResponse_WrapsDataWith200()
    {
        var response = "hello".ToOkApiResponse("It worked");

        response.Code.Should().Be(200);
        response.Message.Should().Be("It worked");
        response.Data.Should().Be("hello");
        response.SubCode.Should().Be("0");
        response.Errors.Should().BeNull();
    }

    [Fact]
    public void ToCreatedApiResponse_WrapsDataWith201()
    {
        var response = 42.ToCreatedApiResponse();

        response.Code.Should().Be(201);
        response.Data.Should().Be(42);
    }

    [Fact]
    public void NotFound_HasNullDataAnd404()
    {
        var response = ApiResponseFactory.NotFound<string>("Missing");

        response.Code.Should().Be(404);
        response.Message.Should().Be("Missing");
        response.Data.Should().BeNull();
    }

    [Fact]
    public void Conflict_Has409()
    {
        var response = ApiResponseFactory.Conflict<string>("Already sealed");

        response.Code.Should().Be(409);
        response.Message.Should().Be("Already sealed");
    }

    [Fact]
    public void ValidationFail_CarriesFieldErrorsAnd422()
    {
        var errors = new[] { new ErrorResponse("Email", "Email is required") };

        var response = ApiResponseFactory.ValidationFail<string>(errors);

        response.Code.Should().Be(422);
        response.Errors.Should().BeEquivalentTo(errors);
    }

    [Fact]
    public void InternalError_DefaultsToGenericMessageAnd500()
    {
        var response = ApiResponseFactory.InternalError<string>();

        response.Code.Should().Be(500);
        response.Message.Should().Be("Something went wrong. Please try again.");
    }

    [Fact]
    public void FromException_MapsStatusCodeAndMessageFromWishDemException()
    {
        var exception = new ConflictException("Duplicate email");

        var response = ApiResponseFactory.FromException<string>(exception);

        response.Code.Should().Be(409);
        response.Message.Should().Be("Duplicate email");
    }
}
