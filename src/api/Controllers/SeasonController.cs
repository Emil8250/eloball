using api.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeasonController(EloballContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<Season>> Get([FromQuery] int leagueId)
    {
        return await context.Seasons
            .Where(s => s.LeagueId == leagueId)
            .OrderByDescending(s => s.StartDate)
            .ToListAsync();
    }

    [HttpGet("active", Name = "GetActiveSeason")]
    public async Task<ActionResult<Season>> GetActive([FromQuery] int leagueId)
    {
        var activeSeason = await context.Seasons
            .Include(s => s.Matches)
            .FirstOrDefaultAsync(s => s.IsActive && s.LeagueId == leagueId);

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
            .OrderByDescending(ps => ps.LatestElo ?? ps.StartingElo)
            .Select(ps => new
            {
                PlayerId = ps.PlayerId,
                PlayerName = ps.Player.Name,
                StartingElo = ps.StartingElo,
                LatestElo = ps.LatestElo,
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
        // Deactivate the league's current active season(s) only.
        var activeSeasons = await context.Seasons
            .Where(s => s.IsActive && s.LeagueId == dto.LeagueId)
            .ToListAsync();
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
            CreatedAt = DateTime.Now,
            LeagueId = dto.LeagueId
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

        // PlayerSeason rows already hold each player's latest rating + stats (maintained
        // live as matches are played), so ending a season just closes it.
        season.IsActive = false;
        season.EndDate = DateTime.Now;
        await context.SaveChangesAsync();

        return season;
    }
}

public record CreateSeasonDto(string Name, int LeagueId, DateTime? StartDate);
