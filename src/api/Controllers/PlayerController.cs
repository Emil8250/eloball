using Microsoft.AspNetCore.Mvc;

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
}