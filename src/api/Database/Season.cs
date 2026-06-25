using System;
using System.Collections.Generic;

namespace api.Database;

public partial class Season
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public int LeagueId { get; set; }

    public virtual League League { get; set; } = null!;

    public virtual ICollection<Match> Matches { get; set; } = new List<Match>();

    public virtual ICollection<PlayerSeason> PlayerSeasons { get; set; } = new List<PlayerSeason>();
}
