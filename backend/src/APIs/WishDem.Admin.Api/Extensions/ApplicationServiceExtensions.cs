using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Identity;
using WishDem.Admin.Api.Configuration;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Services;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Admin.Api.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<SuperAdminOptions>(configuration.GetSection(SuperAdminOptions.SectionName));
        services.Configure<PasswordResetOptions>(configuration.GetSection(PasswordResetOptions.SectionName));

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWishOversightService, WishOversightService>();
        services.AddScoped<IModerationService, ModerationService>();
        services.AddScoped<IPaymentOversightService, PaymentOversightService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IDeliveryHealthService, DeliveryHealthService>();
        services.AddScoped<ICustomerProfileService, CustomerProfileService>();
        services.AddSingleton<IPasswordHasher<AdminUser>, PasswordHasher<AdminUser>>();

        services.AddValidatorsFromAssemblyContaining<Program>();
        services.AddFluentValidationAutoValidation();

        services.AddHostedService<SuperAdminSeeder>();

        return services;
    }
}
