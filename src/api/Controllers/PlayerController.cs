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
        return players;
    }

    [HttpGet("playerMatches", Name = "GetPlayerMatches")]
    public IEnumerable<PlayerMatch> GetPlayerMatches()
    {
        var playerMatches = context.PlayerMatches
            .Include(pm => pm.Player)
            .Include(pm => pm.Match)
            .ToList();
        
        // Break circular references to avoid serialization issues
        foreach (var playerMatch in playerMatches)
        {
            // Prevent circular references
            playerMatch.Player.PlayerMatches = new List<PlayerMatch>();
            playerMatch.Match.PlayerMatches = new List<PlayerMatch>();
        }
        
        return playerMatches;
    }

}