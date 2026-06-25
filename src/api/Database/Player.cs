using System;
using System.Collections.Generic;

namespace api.Database;

public partial class Player
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public DateTime CreatedDateTime { get; set; }

    public DateTime UpdatedDateTime { get; set; }

    public virtual ICollection<PlayerMatch> PlayerMatches { get; set; } = new List<PlayerMatch>();

    public virtual ICollection<PlayerSeason> PlayerSeasons { get; set; } = new List<PlayerSeason>();
}
