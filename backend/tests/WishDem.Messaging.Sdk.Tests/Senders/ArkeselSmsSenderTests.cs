using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using WishDem.Messaging.Sdk;
using WishDem.Messaging.Sdk.Configuration;
using WishDem.Messaging.Sdk.Senders;
using Xunit;

namespace WishDem.Messaging.Sdk.Tests.Senders;

public class ArkeselSmsSenderTests
{
    private class FakeHttpMessageHandler(HttpStatusCode statusCode, object responseBody) : HttpMessageHandler
    {
        public HttpRequestMessage? LastRequest { get; private set; }
        public string? LastRequestBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            LastRequest = request;
            LastRequestBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(ct);

            return new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(JsonSerializer.Serialize(responseBody), Encoding.UTF8, "application/json"),
            };
        }
    }

    private static ArkeselSmsSender BuildSut(HttpStatusCode statusCode, object responseBody, out FakeHttpMessageHandler handler)
    {
        handler = new FakeHttpMessageHandler(statusCode, responseBody);
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://sms.arkesel.com") };
        var options = Options.Create(new ArkeselOptions { ApiKey = "test-key", SenderId = "WishDem" });
        return new ArkeselSmsSender(httpClient, options, Mock.Of<ILogger<ArkeselSmsSender>>());
    }

    [Fact]
    public async Task SendAsync_OnSuccess_PostsToSendEndpointWithApiKeyHeader()
    {
        var sut = BuildSut(HttpStatusCode.OK, new { status = "success", data = new { id = "msg_1", credits_used = 1 } }, out var handler);

        await sut.SendAsync("0244123456", "Your wish has arrived!");

        handler.LastRequest!.RequestUri!.PathAndQuery.Should().Be("/api/v2/sms/send");
        handler.LastRequest.Headers.GetValues("api-key").Should().ContainSingle().Which.Should().Be("test-key");
        handler.LastRequestBody.Should().Contain("\"sender\":\"WishDem\"").And.Contain("\"message\":\"Your wish has arrived!\"");
    }

    [Fact]
    public async Task SendAsync_NormalizesLocalGhanaianNumberToCountryCodeForm()
    {
        var sut = BuildSut(HttpStatusCode.OK, new { status = "success" }, out var handler);

        await sut.SendAsync("024 412 3456", "hi");

        handler.LastRequestBody.Should().Contain("\"233244123456\"");
    }

    [Fact]
    public async Task SendAsync_WhenAlreadyInCountryCodeForm_LeavesItUnchanged()
    {
        var sut = BuildSut(HttpStatusCode.OK, new { status = "success" }, out var handler);

        await sut.SendAsync("+233244123456", "hi");

        handler.LastRequestBody.Should().Contain("\"233244123456\"");
    }

    [Fact]
    public async Task SendAsync_WhenApiReturnsFailureStatus_ThrowsMessagingException()
    {
        var sut = BuildSut(HttpStatusCode.OK, new { status = "failed", message = "Insufficient balance" }, out _);

        var act = async () => await sut.SendAsync("0244123456", "hi");

        (await act.Should().ThrowAsync<MessagingException>()).WithMessage("*Insufficient balance*");
    }

    [Fact]
    public async Task SendAsync_WhenHttpStatusIsError_ThrowsMessagingException()
    {
        var sut = BuildSut(HttpStatusCode.Unauthorized, new { status = "error", message = "Invalid API key" }, out _);

        var act = async () => await sut.SendAsync("0244123456", "hi");

        await act.Should().ThrowAsync<MessagingException>();
    }

    [Theory]
    [InlineData("0244123456", "233244123456")]
    [InlineData("024-412-3456", "233244123456")]
    [InlineData("+233244123456", "233244123456")]
    [InlineData("233244123456", "233244123456")]
    public void NormalizePhoneNumber_HandlesCommonFormats(string input, string expected)
    {
        ArkeselSmsSender.NormalizePhoneNumber(input).Should().Be(expected);
    }
}
