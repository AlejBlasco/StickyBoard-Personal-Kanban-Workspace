using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace StickyBoard.Infrastructure.Persistence;

/// <summary>Used only by `dotnet ef` to create migrations.</summary>
public sealed class DesignTimeFactory : IDesignTimeDbContextFactory<StickyBoardDbContext>
{
    public StickyBoardDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<StickyBoardDbContext>().UseSqlite("Data Source=design.db").Options);
}
