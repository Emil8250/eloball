using System;
using System.Collections.Generic;

namespace api;

public partial class PlayerMatch
{
    public int Id { get; set; }

    public int MatchId { get; set; }

    public int PlayerId { get; set; }

    public int Team { get; set; }

    public virtual Match Match { get; set; } = null!;

    public virtual Player Player { get; set; } = null!;
}
