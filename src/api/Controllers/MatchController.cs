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

    public record MatchRecordSubmit(MatchRecord[] Matches, int TeamWonId, int LeagueId, bool Egg = false);

    [HttpPost(Name = "PostMatch")]
    public async Task<ActionResult> Post([FromBody] MatchRecordSubmit matchRecordSubmit)
    {
        // Active season for the league the match is played in.
        var activeSeason = await context.Seasons
            .FirstOrDefaultAsync(s => s.IsActive && s.LeagueId == matchRecordSubmit.LeagueId);
        if (activeSeason == null)
            return BadRequest("No active season for this league.");

        var newMatch = new Match
        {
            PlayerWonId = matchRecordSubmit.TeamWonId,
            Egg = matchRecordSubmit.Egg,
            SeasonId = activeSeason.Id
        };
        var addedMatch = context.Matches.Add(newMatch);
        await context.SaveChangesAsync();

        var eloMatch = new EloMatch();
        var participants = new List<(PlayerSeason ps, EloPlayerIdentifier id, bool won)>();

        foreach (var record in matchRecordSubmit.Matches)
        {
            var ps = await GetOrCreatePlayerSeason(record.PlayerId, activeSeason.Id);
            var won = record.TeamId == matchRecordSubmit.TeamWonId;
            var currentElo = ps.LatestElo ?? ps.StartingElo;
            var identifier = eloMatch.AddPlayer(currentElo, won);
            participants.Add((ps, identifier, won));

            context.PlayerMatches.Add(new PlayerMatch
            {
                MatchId = addedMatch.Entity.Id,
                PlayerId = record.PlayerId,
                Team = record.TeamId,
            });
        }

        var result = eloMatch.Calculate();
        var isDoubles = matchRecordSubmit.Matches.Length > 2;
        foreach (var (ps, id, won) in participants)
        {
            var currentElo = ps.LatestElo ?? ps.StartingElo;
            var newElo = result.GetRatingAfter(id);
            var difference = newElo - currentElo;
            // Doubles split the delta in half (matches prior behaviour).
            ps.LatestElo = isDoubles ? currentElo + difference / 2 : newElo;
            ps.MatchesPlayed += 1;
            if (won) ps.MatchesWon += 1;
        }

        await context.SaveChangesAsync();
        return Ok();
    }

    private async Task<PlayerSeason> GetOrCreatePlayerSeason(int playerId, int seasonId)
    {
        var ps = await context.PlayerSeasons
            .FirstOrDefaultAsync(x => x.PlayerId == playerId && x.SeasonId == seasonId);
        if (ps == null)
        {
            ps = new PlayerSeason
            {
                PlayerId = playerId,
                SeasonId = seasonId,
                StartingElo = 1000,
                LatestElo = 1000,
                MatchesPlayed = 0,
                MatchesWon = 0,
            };
            context.PlayerSeasons.Add(ps);
        }
        return ps;
    }
}
