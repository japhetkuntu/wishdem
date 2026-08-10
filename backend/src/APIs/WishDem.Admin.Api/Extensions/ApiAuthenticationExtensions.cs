using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using WishDem.Admin.Api.Configuration;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Extensions;

public static class ApiAuthenticationExtensions
{
    public static IServiceCollection AddApiAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwt = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("Missing 'Jwt' configuration section.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwt.Issuer,
                ValidateAudience = true,
                ValidAudience = jwt.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
            };

            // Access tokens carry a "tv" (TokenVersion) claim so a password change or
            // deactivation invalidates every access token already issued, not just future
            // refreshes — without this, a deactivated admin stays authenticated until the
            // token's natural 15-minute expiry.
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = async context =>
                {
                    var userIdClaim = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                    var tokenVersionClaim = context.Principal?.FindFirstValue("tv");
                    if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId) || tokenVersionClaim is null)
                    {
                        context.Fail("Invalid token.");
                        return;
                    }

                    var adminUsers = context.HttpContext.RequestServices.GetRequiredService<IRepository<AdminUser>>();
                    var user = await adminUsers.GetByIdAsync(userId, context.HttpContext.RequestAborted);
                    if (user is null || !user.IsActive || user.TokenVersion.ToString() != tokenVersionClaim)
                        context.Fail("Token is no longer valid.");
                },
            };
        });

        services.AddAuthorization();

        return services;
    }
}
