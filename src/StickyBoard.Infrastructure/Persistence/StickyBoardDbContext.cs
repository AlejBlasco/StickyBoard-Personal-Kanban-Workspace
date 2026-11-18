using Microsoft.EntityFrameworkCore;
using StickyBoard.Domain;

namespace StickyBoard.Infrastructure.Persistence;

public sealed class StickyBoardDbContext(DbContextOptions<StickyBoardDbContext> options) : DbContext(options)
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskItem>(e =>
        {
            e.ToTable("Tasks");
            e.HasKey(t => t.Id);
            e.Property(t => t.Title).IsRequired().HasMaxLength(TaskLimits.TitleMax);
            e.Property(t => t.Description).HasMaxLength(TaskLimits.DescriptionMax);
            e.Property(t => t.Status).HasConversion<string>().HasMaxLength(16);
            e.Property(t => t.Priority).HasConversion<string>().HasMaxLength(16);
            e.Property(t => t.Color).IsRequired().HasMaxLength(16);
            e.HasIndex(t => new { t.Status, t.Position });
            e.HasIndex(t => t.DueDate);
        });
    }
}
