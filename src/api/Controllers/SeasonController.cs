using api.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeasonController(EloballContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<Season>> Get()
    {
        return await context.Seasons
            .OrderByDescending(s => s.StartDate)
            .ToListAsync();
    }

    [HttpGet("active", Name = "GetActiveSeason")]
    public async Task<ActionResult<Season>> GetActive()
    {
        var activeSeason = await context.Seasons
            .Include(s => s.Matches)
            .FirstOrDefaultAsync(s => s.IsActive);

        if (activeSeason == null)
            return NotFound("No active season found");

        return activeSeason;
    }

    [HttpGet("{id}", Name = "GetSeason")]
    public async Task<ActionResult<Season>> GetById(int id)
    {
        var season = await context.Seasons.Include(s => s.Matches).FirstOrDefaultAsync(s => s.Id == id);

        if (season == null)
            return NotFound();

        return season;
    }

    [HttpGet("{id}/leaderboard", Name = "GetSeasonLeaderboard")]
    public async Task<IEnumerable<object>> GetLeaderboard(int id)
    {
        var leaderboard = await context.PlayerSeasons
            .Include(ps => ps.Player)
            .Where(ps => ps.SeasonId == id)
            .OrderByDescending(ps => ps.FinalElo ?? ps.StartingElo)
            .Select(ps => new
            {
                PlayerId = ps.PlayerId,
                PlayerName = ps.Player.Name,
                StartingElo = ps.StartingElo,
                FinalElo = ps.FinalElo,
                MatchesPlayed = ps.MatchesPlayed,
                MatchesWon = ps.MatchesWon,
                WinRate = ps.MatchesPlayed > 0 ? (double)ps.MatchesWon / ps.MatchesPlayed : 0
            })
            .ToListAsync();

        return leaderboard;
    }

    [HttpPost(Name = "CreateSeason")]
    public async Task<ActionResult<Season>> Create([FromBody] CreateSeasonDto dto)
    {
        // Deactivate all current seasons
        var activeSeasons = await context.Seasons.Where(s => s.IsActive).ToListAsync();
        foreach (var s in activeSeasons)
        {
            s.IsActive = false;
            s.EndDate = DateTime.Now;
        }

        var season = new Season
        {
            Name = dto.Name,
            StartDate = dto.StartDate ?? DateTime.Now,
            IsActive = true,
            CreatedAt = DateTime.Now
        };

        context.Seasons.Add(season);
        await context.SaveChangesAsync();

        return CreatedAtRoute("GetSeason", new { id = season.Id }, season);
    }

    [HttpPost("{id}/end", Name = "EndSeason")]
    public async Task<ActionResult<Season>> EndSeason(int id)
    {
        var season = await context.Seasons.FindAsync(id);

        if (season == null)
            return NotFound();

        if (!season.IsActive)
            return BadRequest("Season is already ended");

        season.IsActive = false;
        season.EndDate = DateTime.Now;

        // Get all players who played in this season
        var playersInSeason = await context.PlayerMatches
            .Include(pm => pm.Match)
            .Include(pm => pm.Player)
            .Where(pm => pm.Match.SeasonId == id)
            .Select(pm => pm.Player)
            .Distinct()
            .ToListAsync();

        // Create PlayerSeason entries with stats from matches
        foreach (var player in playersInSeason)
        {
            var matchesPlayed = await context.PlayerMatches
                .Include(pm => pm.Match)
                .Where(pm => pm.PlayerId == player.Id && pm.Match.SeasonId == id)
                .CountAsync();

            // A player won a match when their team is the winning team.
            // (PlayerWonId holds the winning team id, not a player id.)
            var matchesWon = await context.PlayerMatches
                .Include(pm => pm.Match)
                .Where(pm => pm.PlayerId == player.Id && pm.Match.SeasonId == id && pm.Team == pm.Match.PlayerWonId)
                .CountAsync();

            context.PlayerSeasons.Add(new PlayerSeason
            {
                PlayerId = player.Id,
                SeasonId = season.Id,
                StartingElo = 1000,
                FinalElo = player.Elo,
                MatchesPlayed = matchesPlayed,
                MatchesWon = matchesWon
            });

            player.Elo = 1000; // Reset ELO for new season
        }

        await context.SaveChangesAsync();

        return season;
    }
}

public record CreateSeasonDto(string Name, DateTime? StartDate);
