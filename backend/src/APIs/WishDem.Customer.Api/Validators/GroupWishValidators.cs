using FluentValidation;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Validators;

public class CreateGroupWishRequestValidator : AbstractValidator<CreateGroupWishRequest>
{
    public CreateGroupWishRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.RecipientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Formats).NotEmpty().WithMessage("Choose at least one contribution format.");
    }
}

public class InviteGuestRequestValidator : AbstractValidator<InviteGuestRequest>
{
    public InviteGuestRequestValidator()
    {
        RuleFor(x => x.GuestName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.GuestEmail).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.GuestEmail));
    }
}

public class RespondToInvitationRequestValidator : AbstractValidator<RespondToInvitationRequest>
{
    public RespondToInvitationRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum()
            .Must(s => s != WishDem.Common.Sdk.Enums.GroupWishInvitationStatus.Invited)
            .WithMessage("Status must be Joined, Declined, or NotNow.");
    }
}

public class SaveMemoryRequestValidator : AbstractValidator<SaveMemoryRequest>
{
    public SaveMemoryRequestValidator()
    {
        RuleFor(x => x.Format).IsInEnum();
        RuleFor(x => x.Body).NotEmpty().MaximumLength(4000);
    }
}
