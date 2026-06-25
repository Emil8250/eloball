using System.Security.Claims;
using api.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

public record ClaimPlayerDto(int PlayerId, string? Email);
public record CreatePlayerDto(string Name, string? Email);
public record RenamePlayerDto(string Name);

[ApiController]
[Route("api/[controller]")]
public class PlayerController(EloballContext context) : ControllerBase
{
    private string CurrentSub =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new InvalidOperationException("No subject claim on the token.");

    /// <summary>Players who are members of the given league (the league's roster).</summary>
    [HttpGet(Name = "GetPlayers")]
    public async Task<IEnumerable<Player>> Get([FromQuery] int leagueId)
    {
        return await context.LeagueMemberships
            .Where(m => m.LeagueId == leagueId)
            .Select(m => m.Player)
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    /// <summary>The player linked to the current account, or 404 if not yet claimed (→ onboarding).</summary>
    [HttpGet("me", Name = "GetMyPlayer")]
    public async Task<ActionResult<Player>> GetMe()
    {
        var profile = await context.UserProfiles
            .Include(u => u.Player)
            .FirstOrDefaultAsync(u => u.Auth0Sub == CurrentSub);

        if (profile?.Player == null)
            return NotFound();

        return profile.Player;
    }

    /// <summary>Players not yet claimed by any account — candidates for onboarding.</summary>
    [HttpGet("unclaimed", Name = "GetUnclaimedPlayers")]
    public async Task<IEnumerable<Player>> GetUnclaimed()
    {
        var claimedIds = context.UserProfiles
            .Where(u => u.PlayerId != null)
            .Select(u => u.PlayerId!.Value);

        return await context.Players
            .Where(p => !claimedIds.Contains(p.Id))
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    /// <summary>Link the current account to an existing (unclaimed) player.</summary>
    [HttpPost("claim", Name = "ClaimPlayer")]
    public async Task<ActionResult<Player>> Claim([FromBody] ClaimPlayerDto dto)
    {
        var profile = await context.UserProfiles.FirstOrDefaultAsync(u => u.Auth0Sub == CurrentSub);
        if (profile?.PlayerId != null)
            return Conflict("This account is already linked to a player.");

        if (await context.UserProfiles.AnyAsync(u => u.PlayerId == dto.PlayerId))
            return Conflict("That player has already been claimed.");

        var player = await context.Players.FindAsync(dto.PlayerId);
        if (player == null)
            return NotFound("Player not found.");

        await LinkProfile(profile, player.Id, dto.Email);
        return player;
    }

    /// <summary>Create a brand-new player and link it to the current account.</summary>
    [HttpPost(Name = "CreatePlayer")]
    public async Task<ActionResult<Player>> Create([FromBody] CreatePlayerDto dto)
    {
        var profile = await context.UserProfiles.FirstOrDefaultAsync(u => u.Auth0Sub == CurrentSub);
        if (profile?.PlayerId != null)
            return Conflict("This account is already linked to a player.");

        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest("Name is required.");

        var player = new Player { Name = name };
        context.Players.Add(player);
        await context.SaveChangesAsync();

        await LinkProfile(profile, player.Id, dto.Email);
        return player;
    }

    /// <summary>Rename the current account's player.</summary>
    [HttpPut("me", Name = "RenameMyPlayer")]
    public async Task<ActionResult<Player>> RenameMe([FromBody] RenamePlayerDto dto)
    {
        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest("Name is required.");

        var profile = await context.UserProfiles
            .Include(u => u.Player)
            .FirstOrDefaultAsync(u => u.Auth0Sub == CurrentSub);
        if (profile?.Player == null)
            return NotFound();

        profile.Player.Name = name;
        profile.Player.UpdatedDateTime = DateTime.Now;
        await context.SaveChangesAsync();
        return profile.Player;
    }

    private async Task LinkProfile(UserProfile? profile, int playerId, string? email)
    {
        if (profile == null)
        {
            profile = new UserProfile { Auth0Sub = CurrentSub, Email = email };
            context.UserProfiles.Add(profile);
        }
        else if (string.IsNullOrEmpty(profile.Email))
        {
            profile.Email = email;
        }

        profile.PlayerId = playerId;
        profile.UpdatedDateTime = DateTime.Now;
        await context.SaveChangesAsync();
    }

    [HttpGet("playerMatches", Name = "GetPlayerMatches")]
    public IEnumerable<PlayerMatch> GetPlayerMatches([FromQuery] int leagueId)
    {
        var playerMatches = context.PlayerMatches
            .Include(pm => pm.Player)
            .Include(pm => pm.Match)
            .Where(pm => pm.Match.Season != null && pm.Match.Season.LeagueId == leagueId)
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