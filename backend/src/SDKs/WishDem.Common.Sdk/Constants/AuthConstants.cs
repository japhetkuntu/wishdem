namespace WishDem.Common.Sdk.Constants;

public static class AuthConstants
{
    /// <summary>Claim carrying the user's current token version — bumped on password change
    /// so previously issued refresh tokens stop working ("signs out other devices").</summary>
    public const string TokenVersionClaim = "tv";
}
