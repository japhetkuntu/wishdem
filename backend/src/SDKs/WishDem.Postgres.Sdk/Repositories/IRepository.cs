using System.Linq.Expressions;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Repositories;

public interface IRepository<TEntity> where TEntity : BaseEntity
{
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<TEntity?> FindAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default);

    Task<IReadOnlyList<TEntity>> FindManyAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default);

    Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default);

    Task<PagedResult<TEntity>> GetPagedAsync(
        int pageIndex,
        int pageSize,
        Expression<Func<TEntity, bool>>? filter = null,
        Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>>? orderBy = null,
        CancellationToken ct = default);

    /// <summary>For repo-internal LINQ composition only — never leak this queryable to callers.</summary>
    IQueryable<TEntity> GetQueryable();

    Task<bool> AddAsync(TEntity entity, CancellationToken ct = default);

    Task<bool> UpdateAsync(TEntity entity, CancellationToken ct = default);

    /// <summary>Soft-delete: flips IsDeleted rather than removing the row.</summary>
    Task<bool> RemoveAsync(TEntity entity, CancellationToken ct = default);
}
