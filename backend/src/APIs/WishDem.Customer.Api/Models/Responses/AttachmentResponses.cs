using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Responses;

public record AttachmentUploadResponse(string Url, AttachmentKind Kind, int? DurationSeconds);
