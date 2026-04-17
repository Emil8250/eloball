using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace api.Database;

public partial class EloballContext : DbContext
{
    public EloballContext()
    {
    }

    public EloballContext(DbContextOptions<EloballContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Match> Matches { get; set; }

    public virtual DbSet<Player> Players { get; set; }

    public virtual DbSet<PlayerMatch> PlayerMatches { get; set; }

    public virtual DbSet<PlayerSeason> PlayerSeasons { get; set; }

    public virtual DbSet<Season> Seasons { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Match>(entity =>
        {
            entity.ToTable("match");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedDateTime)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("createdDateTime");
            entity.Property(e => e.Egg).HasColumnName("egg");
            entity.Property(e => e.PlayerWonId).HasColumnName("playerWonId");
            entity.Property(e => e.SeasonId).HasColumnName("seasonId");
            entity.Property(e => e.UpdatedDateTime)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("updatedDateTime");

            entity.HasOne(d => d.Season).WithMany(p => p.Matches)
                .HasForeignKey(d => d.SeasonId)
                .HasConstraintName("FK__match__seasonId__66603565");
        });

        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_user");

            entity.ToTable("player");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedDateTime)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("createdDateTime");
            entity.Property(e => e.Elo)
                .HasDefaultValue(1000)
                .HasColumnName("elo");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.UpdatedDateTime)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("updatedDateTime");
        });

        modelBuilder.Entity<PlayerMatch>(entity =>
        {
            entity.ToTable("playerMatch");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedDateTime)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("createdDateTime");
            entity.Property(e => e.MatchId).HasColumnName("matchId");
            entity.Property(e => e.PlayerId).HasColumnName("playerId");
            entity.Property(e => e.Team).HasColumnName("team");
            entity.Property(e => e.UpdatedDateTime)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("updatedDateTime");

            entity.HasOne(d => d.Match).WithMany(p => p.PlayerMatches)
                .HasForeignKey(d => d.MatchId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_playerMatch_match");

            entity.HasOne(d => d.Player).WithMany(p => p.PlayerMatches)
                .HasForeignKey(d => d.PlayerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_playerMatch_player");
        });

        modelBuilder.Entity<PlayerSeason>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__playerSe__3213E83FEE05EAF6");

            entity.ToTable("playerSeason");

            entity.HasIndex(e => new { e.PlayerId, e.SeasonId }, "UQ_PlayerSeason").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.FinalElo).HasColumnName("finalElo");
            entity.Property(e => e.MatchesPlayed).HasColumnName("matchesPlayed");
            entity.Property(e => e.MatchesWon).HasColumnName("matchesWon");
            entity.Property(e => e.PlayerId).HasColumnName("playerId");
            entity.Property(e => e.SeasonId).HasColumnName("seasonId");
            entity.Property(e => e.StartingElo)
                .HasDefaultValue(1000)
                .HasColumnName("startingElo");

            entity.HasOne(d => d.Player).WithMany(p => p.PlayerSeasons)
                .HasForeignKey(d => d.PlayerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__playerSea__playe__6477ECF3");

            entity.HasOne(d => d.Season).WithMany(p => p.PlayerSeasons)
                .HasForeignKey(d => d.SeasonId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__playerSea__seaso__656C112C");
        });

        modelBuilder.Entity<Season>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__season__3213E83F557DB387");

            entity.ToTable("season");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("createdAt");
            entity.Property(e => e.EndDate)
                .HasColumnType("datetime")
                .HasColumnName("endDate");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("isActive");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.StartDate)
                .HasColumnType("datetime")
                .HasColumnName("startDate");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
