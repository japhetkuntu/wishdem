using FluentAssertions;
using WishDem.Common.Sdk.Utilities;
using Xunit;

namespace WishDem.Common.Sdk.Tests.Utilities;

public class PhoneNumberFormatterTests
{
    [Theory]
    [InlineData("0244123456", "+233244123456")]
    [InlineData("024 412 3456", "+233244123456")]
    [InlineData("024-412-3456", "+233244123456")]
    [InlineData("233244123456", "+233244123456")]
    [InlineData("+233244123456", "+233244123456")]
    [InlineData("244123456", "+233244123456")]
    public void Normalize_RecognizedGhanaianShapes_ReturnsE164(string raw, string expected) =>
        PhoneNumberFormatter.Normalize(raw).Should().Be(expected);

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Normalize_NullOrBlank_ReturnsInputUnchanged(string? raw) =>
        PhoneNumberFormatter.Normalize(raw).Should().Be(raw);

    [Fact]
    public void Normalize_UnrecognizedShape_ReturnsOriginalUntouched()
    {
        const string raw = "12345";
        PhoneNumberFormatter.Normalize(raw).Should().Be(raw);
    }
}
