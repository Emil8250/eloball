using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace api;

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

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, yoWu should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source=EMILS-PC\\SQLEXPRESS;Initial Catalog=eloball;TrustServerCertificate=True;Trusted_Connection=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Match>(entity =>
        {
            entity.ToTable("match");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.PlayerWonId).HasColumnName("playerWonId");
        });

        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_user");

            entity.ToTable("player");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Elo)
                .HasDefaultValue(1000)
                .HasColumnName("elo");
            entity.Property(e => e.Name).HasColumnName("name");
        });

        modelBuilder.Entity<PlayerMatch>(entity =>
        {
            entity.ToTable("playerMatch");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.MatchId).HasColumnName("matchId");
            entity.Property(e => e.PlayerId).HasColumnName("playerId");
            entity.Property(e => e.Team).HasColumnName("team");

            entity.HasOne(d => d.Match).WithMany(p => p.PlayerMatches)
                .HasForeignKey(d => d.MatchId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_playerMatch_match");

            entity.HasOne(d => d.Player).WithMany(p => p.PlayerMatches)
                .HasForeignKey(d => d.PlayerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_playerMatch_player");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
