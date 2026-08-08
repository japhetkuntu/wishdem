using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Requests;

public record SaveCirclePersonRequest(
    string Name,
    string RelationshipLabel,
    CircleGroup Group,
    DateOnly? Birthday,
    string? Timezone,
    string? Note);
