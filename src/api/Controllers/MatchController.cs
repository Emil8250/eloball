using EloCalculator;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchController(EloballContext context) : ControllerBase
{
    public record MatchRecord(int FirstPlayerId, int SecondPlayerId, int PlayerWonId);
    [HttpPost(Name = "PostMatch")]
    public async Task Post([FromBody] MatchRecord matchRecord)
    {
        var newMatch = new Match()
        {
            FirstPlayerId = matchRecord.FirstPlayerId,
            SecondPlayerId = matchRecord.SecondPlayerId,
            PlayerWonId = matchRecord.PlayerWonId
        };
        context.Matches.Add(newMatch);
        var match = new EloMatch();
        var firstPlayer = context.Players.Single(x => x.Id == matchRecord.FirstPlayerId);
        var secondPlayer = context.Players.Single(x => x.Id == matchRecord.SecondPlayerId);
        var player1Identifier = match.AddPlayer(firstPlayer.Elo, firstPlayer.Id == matchRecord.PlayerWonId);
        var player2Identifier = match.AddPlayer(secondPlayer.Elo, secondPlayer.Id == matchRecord.PlayerWonId);
        var result = match.Calculate();
        firstPlayer.Elo = result.GetRatingAfter(player1Identifier);
        secondPlayer.Elo = result.GetRatingAfter(player2Identifier);
        context.Players.Update(firstPlayer);
        context.Players.Update(secondPlayer);
        await context.SaveChangesAsync();
    }
}