using FluentValidation;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Validators;

public class SaveCirclePersonRequestValidator : AbstractValidator<SaveCirclePersonRequest>
{
    public SaveCirclePersonRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.RelationshipLabel).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Group).IsInEnum();
    }
}
