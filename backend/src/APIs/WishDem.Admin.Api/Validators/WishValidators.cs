using FluentValidation;
using WishDem.Admin.Api.Models.Requests;

namespace WishDem.Admin.Api.Validators;

public class UpdateWishStatusRequestValidator : AbstractValidator<UpdateWishStatusRequest>
{
    public UpdateWishStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}
