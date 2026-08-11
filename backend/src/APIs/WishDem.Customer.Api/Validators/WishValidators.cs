using FluentValidation;
using WishDem.Common.Sdk.Enums;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Validators;

public class SaveWishRequestValidator : AbstractValidator<SaveWishRequest>
{
    public SaveWishRequestValidator()
    {
        RuleFor(x => x.RecipientName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.RecipientRelationship).NotEmpty().MaximumLength(60);
        RuleFor(x => x.RecipientTimezone).NotEmpty();
        RuleFor(x => x.Message).MaximumLength(2000);
        RuleFor(x => x.RecipientPhoneNumber).MaximumLength(32);

        // The recipient never has a WishDem account, so Sms/WhatsApp delivery has no way
        // to reach them without a phone number — Link is the only channel that doesn't need one.
        RuleFor(x => x.RecipientPhoneNumber)
            .NotEmpty()
            .When(x => x.Channel is DeliveryChannel.Sms or DeliveryChannel.WhatsApp)
            .WithMessage("A phone number is required for SMS or WhatsApp delivery.");
    }
}

public class RetryDeliveryRequestValidator : AbstractValidator<RetryDeliveryRequest>
{
    public RetryDeliveryRequestValidator()
    {
        RuleFor(x => x.RecipientPhoneNumber).NotEmpty().MaximumLength(32);
    }
}
