namespace WishDem.Customer.Api.Configuration;

public class OtpOptions
{
    public const string SectionName = "Otp";

    public int ExpirySeconds { get; set; } = 600;
    public int ResendCooldownSeconds { get; set; } = 30;

    /// <summary>Failed verify attempts allowed against one issued code before it's locked
    /// out — without this a code is guessable (1M combinations) via unlimited submissions
    /// to the verify endpoint, which the request-endpoint rate limit doesn't cover.</summary>
    public int MaxAttempts { get; set; } = 5;

    /// <summary>When true, the raw code is included in the API response so it can be
    /// tested without a real mailbox. Only ever honoured outside Production.</summary>
    public bool ReturnCodeInResponse { get; set; } = true;
}
