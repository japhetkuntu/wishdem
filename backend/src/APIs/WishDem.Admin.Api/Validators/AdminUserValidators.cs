using FluentValidation;
using WishDem.Admin.Api.Models.Requests;

namespace WishDem.Admin.Api.Validators;

public class InviteAdminUserRequestValidator : AbstractValidator<InviteAdminUserRequest>
{
    public InviteAdminUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Role).NotEmpty().MaximumLength(100);
    }
}
