using System;
using System.Collections.Generic;

namespace api.Database;

public partial class PlayerSeason
{
    public int Id { get; set; }

    public int PlayerId { get; set; }

    public int SeasonId { get; set; }

    public int StartingElo { get; set; }

    /// <summary>The player's live rating in this season; frozen once the season ends.</summary>
    public int? LatestElo { get; set; }

    public int MatchesPlayed { get; set; }

    public int MatchesWon { get; set; }

    public virtual Player Player { get; set; } = null!;

    public virtual Season Season { get; set; } = null!;
}
