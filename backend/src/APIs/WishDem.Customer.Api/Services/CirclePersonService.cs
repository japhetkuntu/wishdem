using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

public class CirclePersonService(IRepository<CirclePerson> people, ILogger<CirclePersonService> logger) : ICirclePersonService
{
    public async Task<IApiResponse<IReadOnlyList<CirclePersonResponse>>> GetMineAsync(Guid customerUserId, CancellationToken ct = default)
    {
        try
        {
            var mine = await people.FindManyAsync(p => p.CustomerUserId == customerUserId, ct);
            IReadOnlyList<CirclePersonResponse> result = mine.OrderBy(p => p.Name).Select(ToResponse).ToList();
            return result.ToOkApiResponse("Circle people retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetMineAsync] Failed to list circle people for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<IReadOnlyList<CirclePersonResponse>>("Failed to retrieve circle people.");
        }
    }

    public async Task<IApiResponse<CirclePersonResponse>> CreateAsync(Guid customerUserId, SaveCirclePersonRequest request, CancellationToken ct = default)
    {
        try
        {
            var person = new CirclePerson
            {
                CustomerUserId = customerUserId,
                Name = request.Name,
                RelationshipLabel = request.RelationshipLabel,
            };
            ApplyRequest(person, request);

            await people.AddAsync(person, ct);
            return ToResponse(person).ToCreatedApiResponse("Circle person created successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[CreateAsync] Failed to create circle person for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<CirclePersonResponse>("Failed to create circle person.");
        }
    }

    public async Task<IApiResponse<CirclePersonResponse>> UpdateAsync(Guid customerUserId, Guid personId, SaveCirclePersonRequest request, CancellationToken ct = default)
    {
        try
        {
            var person = await GetOwnedAsync(customerUserId, personId, ct);
            ApplyRequest(person, request);
            await people.UpdateAsync(person, ct);
            return ToResponse(person).ToOkApiResponse("Circle person updated successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<CirclePersonResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[UpdateAsync] Failed to update circle person {PersonId} for customer {CustomerUserId}", personId, customerUserId);
            return ApiResponseFactory.InternalError<CirclePersonResponse>("Failed to update circle person.");
        }
    }

    public async Task<IApiResponse<bool>> DeleteAsync(Guid customerUserId, Guid personId, CancellationToken ct = default)
    {
        try
        {
            var person = await GetOwnedAsync(customerUserId, personId, ct);
            await people.RemoveAsync(person, ct);
            return true.ToOkApiResponse("Circle person deleted successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<bool>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[DeleteAsync] Failed to delete circle person {PersonId} for customer {CustomerUserId}", personId, customerUserId);
            return ApiResponseFactory.InternalError<bool>("Failed to delete circle person.");
        }
    }

    private async Task<CirclePerson> GetOwnedAsync(Guid customerUserId, Guid personId, CancellationToken ct)
    {
        var person = await people.GetByIdAsync(personId, ct)
            ?? throw new NotFoundException("That person could not be found.");

        if (person.CustomerUserId != customerUserId)
            throw new NotFoundException("That person could not be found.");

        return person;
    }

    private static void ApplyRequest(CirclePerson person, SaveCirclePersonRequest request)
    {
        person.Name = request.Name;
        person.RelationshipLabel = request.RelationshipLabel;
        person.Group = request.Group;
        person.Birthday = request.Birthday;
        person.Timezone = request.Timezone;
        person.Note = request.Note;
    }

    private static CirclePersonResponse ToResponse(CirclePerson p) => new(
        p.Id, p.Name, p.RelationshipLabel, p.Group, p.Birthday, p.Timezone, p.Note, p.CreatedAtUtc);
}
