using FluentValidation;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Validators;

public class InitiatePaymentRequestValidator : AbstractValidator<InitiatePaymentRequest>
{
    public InitiatePaymentRequestValidator()
    {
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(32);
        RuleFor(x => x.Provider).IsInEnum();
    }
}

public class SimulatePaymentOutcomeRequestValidator : AbstractValidator<SimulatePaymentOutcomeRequest>
{
    public SimulatePaymentOutcomeRequestValidator()
    {
        RuleFor(x => x.FailureReason).MaximumLength(500);
    }
}
