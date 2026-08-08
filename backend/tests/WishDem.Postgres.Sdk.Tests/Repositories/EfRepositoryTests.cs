using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Persistence;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Postgres.Sdk.Tests.Repositories;

public class EfRepositoryTests : IDisposable
{
    private readonly WishDemDbContext _context;
    private readonly EfRepository<CustomerUser> _sut;

    public EfRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<WishDemDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new WishDemDbContext(options);
        _sut = new EfRepository<CustomerUser>(_context);
    }

    public void Dispose() => _context.Dispose();

    private static CustomerUser NewCustomer(string email = "test@example.com") => new()
    {
        Email = email,
        Name = "Test Customer",
    };

    [Fact]
    public async Task AddAsync_PersistsEntity()
    {
        var customer = NewCustomer();

        var result = await _sut.AddAsync(customer);

        result.Should().BeTrue();
        (await _sut.GetByIdAsync(customer.Id)).Should().NotBeNull();
    }

    [Fact]
    public async Task GetByIdAsync_WhenNotFound_ReturnsNull()
    {
        var result = await _sut.GetByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task RemoveAsync_SoftDeletes_EntityNoLongerReturnedByDefaultQueries()
    {
        var customer = NewCustomer();
        await _sut.AddAsync(customer);

        await _sut.RemoveAsync(customer);

        customer.IsDeleted.Should().BeTrue();
        (await _sut.GetByIdAsync(customer.Id)).Should().BeNull();
    }

    [Fact]
    public async Task RemoveAsync_DoesNotPhysicallyDeleteRow()
    {
        var customer = NewCustomer();
        await _sut.AddAsync(customer);

        await _sut.RemoveAsync(customer);

        var stillInTable = await _context.CustomerUsers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == customer.Id);
        stillInTable.Should().NotBeNull();
        stillInTable!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAsync_StampsUpdatedAtUtc()
    {
        var customer = NewCustomer();
        await _sut.AddAsync(customer);

        customer.Name = "Renamed";
        await _sut.UpdateAsync(customer);

        customer.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task GetPagedAsync_FiltersOrdersAndPaginates()
    {
        for (var i = 0; i < 5; i++)
        {
            await _sut.AddAsync(NewCustomer($"user{i}@example.com"));
        }

        var page = await _sut.GetPagedAsync(
            pageIndex: 0,
            pageSize: 2,
            orderBy: q => q.OrderBy(c => c.Email));

        page.TotalCount.Should().Be(5);
        page.Items.Should().HaveCount(2);
        page.Items[0].Email.Should().Be("user0@example.com");
    }

    [Fact]
    public async Task ExistsAsync_ReflectsPredicate()
    {
        await _sut.AddAsync(NewCustomer("findme@example.com"));

        (await _sut.ExistsAsync(c => c.Email == "findme@example.com")).Should().BeTrue();
        (await _sut.ExistsAsync(c => c.Email == "nope@example.com")).Should().BeFalse();
    }
}
