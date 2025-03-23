using System;
using System.Collections.Generic;

namespace api;

public partial class Match
{
    public int Id { get; set; }

    public int PlayerWonId { get; set; }

    public virtual ICollection<PlayerMatch> PlayerMatches { get; set; } = new List<PlayerMatch>();
}
