using api.Database;
using EloCalculator;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchController(EloballContext context) : ControllerBase
{
    public record MatchRecord(int PlayerId, int TeamId);

    public record MatchRecordSubmit(MatchRecord[] Matches, int TeamWonId, bool Egg = false);
    [HttpPost(Name = "PostMatch")]
    public async Task Post([FromBody] MatchRecordSubmit matchRecordSubmit)
    {
        // Get active season
        var activeSeason = await context.Seasons.FirstOrDefaultAsync(s => s.IsActive);

        var newMatch = new Match()
        {
            PlayerWonId = matchRecordSubmit.TeamWonId,
            Egg = matchRecordSubmit.Egg,
            SeasonId = activeSeason?.Id
        };
        var addedMatch = context.Matches.Add(newMatch);
        await context.SaveChangesAsync();
        var match = new EloMatch();
        List<(EloPlayerIdentifier eloPlayerIdentifier, int playerId)> eloPlayers = new();
        List<Player> players = new();
        foreach (var matchRecord in matchRecordSubmit.Matches)
        {
            var player = context.Players.Single(x => x.Id == matchRecord.PlayerId);
            players.Add(player);
            var playerIdentifier = match.AddPlayer(player.Elo, matchRecord.TeamId == matchRecordSubmit.TeamWonId);
            eloPlayers.Add((playerIdentifier, player.Id));
            context.PlayerMatches.Add(new PlayerMatch
            {
                MatchId = addedMatch.Entity.Id,
                PlayerId = matchRecord.PlayerId,
                Team = matchRecord.TeamId,
            });
        }

        var result = match.Calculate();
        foreach (var player in players)
        {
            var currentElo = player.Elo;
            var newElo = result.GetRatingAfter(eloPlayers.Single(x => x.playerId == player.Id).eloPlayerIdentifier);

            var difference = newElo - currentElo;

            player.Elo = players.Count > 2 ? currentElo + difference / 2 : newElo;
                
            context.Players.Update(player);
        }

        await context.SaveChangesAsync();
    }
}