namespace WishDem.Common.Sdk.Enums;

/// <summary>Categorizes an audit event by sensitivity, mirroring the badges shown on
/// the admin activity log so reviewers can quickly spot what needs closer attention.</summary>
public enum AuditTag
{
    General = 0,
    ContentAccess = 1,
    SensitiveAccess = 2,
    CriticalAccess = 3,
    SensitiveExport = 4,
    Security = 5,
}
