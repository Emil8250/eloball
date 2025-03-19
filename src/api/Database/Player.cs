using System;
using System.Collections.Generic;

namespace api;

public partial class Player
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int Elo { get; set; }
}
