using FluentValidation;
using WishDem.Admin.Api.Models.Requests;

namespace WishDem.Admin.Api.Validators;

public class CreateModerationCaseRequestValidator : AbstractValidator<CreateModerationCaseRequest>
{
    public CreateModerationCaseRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Severity).IsInEnum();
    }
}

public class DecideModerationCaseRequestValidator : AbstractValidator<DecideModerationCaseRequest>
{
    public DecideModerationCaseRequestValidator()
    {
        RuleFor(x => x.Decision).IsInEnum();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(1000);
    }
}
