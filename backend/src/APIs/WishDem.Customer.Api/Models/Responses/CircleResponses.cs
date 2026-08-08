using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Responses;

public record CirclePersonResponse(
    Guid Id,
    string Name,
    string RelationshipLabel,
    CircleGroup Group,
    DateOnly? Birthday,
    string? Timezone,
    string? Note,
    DateTime CreatedAtUtc);
