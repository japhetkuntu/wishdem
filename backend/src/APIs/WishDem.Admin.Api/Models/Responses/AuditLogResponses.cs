using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Models.Responses;

public record AuditEventResponse(
    Guid Id,
    string AdminName,
    string Action,
    string ResourceType,
    Guid? ResourceId,
    string Summary,
    AuditTag Tag,
    DateTime CreatedAtUtc);
