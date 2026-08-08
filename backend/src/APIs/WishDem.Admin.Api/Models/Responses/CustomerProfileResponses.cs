using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Models.Responses;

public record CustomerProfileResponse(
    Guid Id,
    string Email,
    string Name,
    DateTime CreatedAtUtc,
    DateTime? LastLoginAtUtc,
    int TotalWishCount,
    Dictionary<WishStatus, int> WishCountByStatus,
    decimal TotalAmountPaid);
