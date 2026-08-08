using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Persistence;

namespace WishDem.Postgres.Sdk.Repositories;

public class EfRepository<TEntity>(WishDemDbContext context) : IRepository<TEntity>
    where TEntity : BaseEntity
{
    private readonly DbSet<TEntity> _set = context.Set<TEntity>();

    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _set.FirstOrDefaultAsync(e => e.Id == id, ct);

    public Task<TEntity?> FindAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default) =>
        _set.FirstOrDefaultAsync(predicate, ct);

    public async Task<IReadOnlyList<TEntity>> FindManyAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default) =>
        await _set.Where(predicate).ToListAsync(ct);

    public Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default) =>
        _set.AnyAsync(predicate, ct);

    public async Task<PagedResult<TEntity>> GetPagedAsync(
        int pageIndex,
        int pageSize,
        Expression<Func<TEntity, bool>>? filter = null,
        Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>>? orderBy = null,
        CancellationToken ct = default)
    {
        IQueryable<TEntity> query = _set;
        if (filter is not null) query = query.Where(filter);

        var totalCount = await query.CountAsync(ct);
        if (orderBy is not null) query = orderBy(query);

        var items = await query
            .Skip(pageIndex * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<TEntity>
        {
            Items = items,
            PageIndex = pageIndex,
            PageSize = pageSize,
            TotalCount = totalCount,
        };
    }

    public IQueryable<TEntity> GetQueryable() => _set.AsQueryable();

    public async Task<bool> AddAsync(TEntity entity, CancellationToken ct = default)
    {
        await _set.AddAsync(entity, ct);
        return await context.SaveChangesAsync(ct) > 0;
    }

    public async Task<bool> UpdateAsync(TEntity entity, CancellationToken ct = default)
    {
        entity.UpdatedAtUtc = DateTime.UtcNow;
        _set.Update(entity);
        return await context.SaveChangesAsync(ct) > 0;
    }

    public async Task<bool> RemoveAsync(TEntity entity, CancellationToken ct = default)
    {
        entity.IsDeleted = true;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        _set.Update(entity);
        return await context.SaveChangesAsync(ct) > 0;
    }
}
