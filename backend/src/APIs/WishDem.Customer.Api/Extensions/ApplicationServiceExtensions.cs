using FluentValidation;
using FluentValidation.AspNetCore;
using WishDem.Customer.Api.Configuration;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Services;
using WishDem.Customer.Api.Workers;

namespace WishDem.Customer.Api.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<OtpOptions>(configuration.GetSection(OtpOptions.SectionName));
        services.Configure<GoogleAuthOptions>(configuration.GetSection(GoogleAuthOptions.SectionName));

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWishService, WishService>();
        services.AddScoped<ICirclePersonService, CirclePersonService>();
        services.AddScoped<ICalendarService, CalendarService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IGroupWishService, GroupWishService>();
        services.AddScoped<IGroupWishGuestService, GroupWishGuestService>();
        services.AddScoped<IBirthdayBloomService, BirthdayBloomService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IWishDeliveryDispatchService, WishDeliveryDispatchService>();
        services.AddHostedService<WishDeliveryBackgroundService>();

        services.AddValidatorsFromAssemblyContaining<Program>();
        services.AddFluentValidationAutoValidation();

        return services;
    }
}
