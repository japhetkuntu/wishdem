using WishDem.Common.Sdk.Enums;

namespace WishDem.Postgres.Sdk.Entities;

/// <summary>A saved contact in a customer's Circle, reusable across multiple wishes
/// without re-entering their details each time.</summary>
public class CirclePerson : BaseEntity
{
    public Guid CustomerUserId { get; set; }
    public CustomerUser? CustomerUser { get; set; }

    public required string Name { get; set; }
    public required string RelationshipLabel { get; set; }
    public CircleGroup Group { get; set; } = CircleGroup.Friends;
    public DateOnly? Birthday { get; set; }
    public string? Timezone { get; set; }
    public string? Note { get; set; }
}
