namespace WishDem.Admin.Api.Configuration;

/// <summary>The admin-portal frontend's public URL — used only to build a "Sign in" link
/// in team-invite emails, so new/reinvited teammates land straight on the login screen
/// instead of having to go find it themselves.</summary>
public class AdminPortalOptions
{
    public const string SectionName = "AdminPortal";

    public string Url { get; set; } = "http://localhost:5174";
}
