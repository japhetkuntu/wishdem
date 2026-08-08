namespace WishDem.Admin.Api.Configuration;

/// <summary>Mirrors the Customer API's OtpOptions: TTL/cooldown for the admin
/// password-reset code, plus a dev-only escape hatch to see the code without a mailbox.</summary>
public class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    public int ExpirySeconds { get; set; } = 600;
    public int ResendCooldownSeconds { get; set; } = 30;

    /// <summary>When true, the raw code is included in the API response so it can be
    /// tested without a real mailbox. Only ever honoured outside Production.</summary>
    public bool ReturnCodeInResponse { get; set; } = true;
}
