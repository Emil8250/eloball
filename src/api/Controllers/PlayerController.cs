using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayerController(EloballContext context) : ControllerBase
{
    [HttpGet(Name = "GetPlayers")]
    public IEnumerable<Player> Get()
    {
        var players = context.Players.ToList();
        players = context.Players
            .Include(p => p.PlayerMatches)
            .ThenInclude(pm => pm.Match)
            .ToList();
        return players;
    }
}