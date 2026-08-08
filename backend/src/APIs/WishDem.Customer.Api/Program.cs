using Microsoft.AspNetCore.Mvc;
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

const string CorsPolicyName = "WishDemDefault";
builder.Services.AddCors(options => options.AddPolicy(CorsPolicyName, policy => policy
    .AllowAnyOrigin()
    .AllowAnyHeader()
    .AllowAnyMethod()));

builder.Services.AddPostgresSdk(builder.Configuration);
builder.Services.AddCacheSdk(builder.Configuration);
builder.Services.AddMessagingSdk(builder.Configuration);
builder.Services.AddStorageSdk(builder.Configuration);
builder.Services.AddActorsSdk(builder.Configuration);
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddApiAuthentication(builder.Configuration);

builder.Services.AddHealthChecks();

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

app.UseWishDemExceptionHandling();

app.UseHttpsRedirection();

app.UseCors(CorsPolicyName);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
