using System;
using System.Collections.Generic;

namespace api;

public partial class Match
{
    public int Id { get; set; }

    public int FirstPlayerId { get; set; }

    public int SecondPlayerId { get; set; }

    public int PlayerWonId { get; set; }
}
