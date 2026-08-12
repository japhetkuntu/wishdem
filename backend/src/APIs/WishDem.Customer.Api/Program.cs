using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Serilog;
using WishDem.Actors.Sdk.Extensions;
using WishDem.Cache.Sdk.Extensions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Extensions;
using WishDem.Messaging.Sdk.Extensions;
using WishDem.Postgres.Sdk.Extensions;
using WishDem.Storage.Sdk.Extensions;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/customer-api-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// Kestrel's own default request body cap (30,000,000 bytes, i.e. ~28.6MiB) sits just under
// WishService.MaxAttachmentBytes (30MiB) — without raising it, uploads between the two
// thresholds get rejected by Kestrel itself with a raw framework error before WishService's
// friendly "that file is too large" message ever runs. A small margin above the app's own
// cap keeps that check the one that actually fires.
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 33 * 1024 * 1024);

const string CorsPolicyName = "WishDemDefault";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? throw new InvalidOperationException("Missing configuration 'Cors:AllowedOrigins'.");
builder.Services.AddCors(options => options.AddPolicy(CorsPolicyName, policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

if (builder.Environment.IsProduction())
{
    if (builder.Configuration["Jwt:SigningKey"]?.StartsWith("dev-only-signing-key", StringComparison.Ordinal) != false)
        throw new InvalidOperationException("Refusing to start in Production with the default dev JWT signing key. Override 'Jwt:SigningKey'.");
}

builder.Services.AddPostgresSdk(builder.Configuration);
builder.Services.AddCacheSdk(builder.Configuration);
builder.Services.AddMessagingSdk(builder.Configuration);
builder.Services.AddStorageSdk(builder.Configuration);
builder.Services.AddActorsSdk(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddApiAuthentication(builder.Configuration);

builder.Services.AddHealthChecks();

// Throttles OTP request/verify brute-forcing — partitioned per client IP so one abusive
// caller can't exhaust the bucket for everyone else.
const string AuthRateLimiterPolicy = "auth";
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(AuthRateLimiterPolicy, context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));
});

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    // Keep validation failures inside the same ApiResponse envelope every other
    // endpoint returns, rather than ASP.NET's default ProblemDetails shape.
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .Select(entry => new ErrorResponse(entry.Key, entry.Value!.Errors.First().ErrorMessage))
            .ToList();

        var response = ApiResponseFactory.ValidationFail<object>(errors);
        return new BadRequestObjectResult(response);
    };
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // Enums as camelCase strings ("sealed", not "1") — a JSON API should be
    // self-documenting on the wire, not depend on clients hardcoding enum order.
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" },
            },
            []
        },
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsProduction())
{
    // Local/dev applies migrations by hand (`dotnet ef database update`) against the
    // docker-compose Postgres, but a fresh droplet has no SDK/dotnet-ef installed —
    // applying them here instead means a first deploy only needs `docker compose up`.
    // Only Customer.Api does this (not Admin.Api, which shares the same database) so
    // two containers starting together can't race to apply the same migration.
    using var migrationScope = app.Services.CreateScope();
    var dbContext = migrationScope.ServiceProvider.GetRequiredService<WishDem.Postgres.Sdk.Persistence.WishDemDbContext>();
    dbContext.Database.Migrate();
}

app.UseWishDemExceptionHandling();

app.UseHttpsRedirection();

app.UseCors(CorsPolicyName);

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
