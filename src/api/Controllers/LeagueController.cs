using System.Security.Claims;
using api.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

public record CreateLeagueDto(string Name);
public record RenameLeagueDto(string Name);
public record DelegateLeagueDto(int PlayerId);

[ApiController]
[Route("api/[controller]")]
public class LeagueController(EloballContext context) : ControllerBase
{
    private const string Owner = "Owner";
    private const string Member = "Member";

    private string CurrentSub =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? throw new InvalidOperationException("No subject claim on the token.");

    private async Task<int?> CurrentPlayerId()
    {
        var profile = await context.UserProfiles.FirstOrDefaultAsync(u => u.Auth0Sub == CurrentSub);
        return profile?.PlayerId;
    }

    private Task<LeagueMembership?> Membership(int leagueId, int playerId) =>
        context.LeagueMemberships.FirstOrDefaultAsync(m => m.LeagueId == leagueId && m.PlayerId == playerId);

    /// <summary>All leagues (for browse/join).</summary>
    [HttpGet]
    public async Task<IEnumerable<object>> Get()
    {
        var playerId = await CurrentPlayerId();
        return await context.Leagues
            .OrderBy(l => l.Name)
            .Select(l => new
            {
                l.Id,
                l.Name,
                MemberCount = l.Memberships.Count,
                IsMember = playerId != null && l.Memberships.Any(m => m.PlayerId == playerId),
                HasOwner = l.Memberships.Any(m => m.Role == Owner),
            })
            .ToListAsync();
    }

    /// <summary>Leagues the current player belongs to (+ their role).</summary>
    [HttpGet("mine", Name = "GetMyLeagues")]
    public async Task<IEnumerable<object>> Mine()
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return Array.Empty<object>();

        return await context.LeagueMemberships
            .Where(m => m.PlayerId == playerId)
            .OrderBy(m => m.League.Name)
            .Select(m => new
            {
                Id = m.LeagueId,
                m.League.Name,
                m.Role,
                MemberCount = m.League.Memberships.Count,
                HasOwner = m.League.Memberships.Any(x => x.Role == Owner),
            })
            .ToListAsync();
    }

    /// <summary>Members of a league (player id + name + role) — for owner management UI.</summary>
    [HttpGet("{id}/members", Name = "GetLeagueMembers")]
    public async Task<IEnumerable<object>> Members(int id)
    {
        return await context.LeagueMemberships
            .Where(m => m.LeagueId == id)
            .OrderByDescending(m => m.Role == Owner)
            .ThenBy(m => m.Player.Name)
            .Select(m => new { m.PlayerId, m.Player.Name, m.Role })
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateLeagueDto dto)
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return BadRequest("Claim a player first.");

        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name is required.");

        var league = new League { Name = name };
        context.Leagues.Add(league);
        await context.SaveChangesAsync();

        context.LeagueMemberships.Add(new LeagueMembership
        {
            LeagueId = league.Id,
            PlayerId = playerId.Value,
            Role = Owner,
        });
        await context.SaveChangesAsync();

        return Ok(new { league.Id, league.Name });
    }

    [HttpPut("{id}", Name = "RenameLeague")]
    public async Task<ActionResult> Rename(int id, [FromBody] RenameLeagueDto dto)
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return BadRequest("Claim a player first.");

        var league = await context.Leagues.FindAsync(id);
        if (league == null) return NotFound();

        var membership = await Membership(id, playerId.Value);
        if (membership?.Role != Owner) return BadRequest("Only the league owner can rename it.");

        var name = dto.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name is required.");

        league.Name = name;
        league.UpdatedDateTime = DateTime.Now;
        await context.SaveChangesAsync();
        return Ok(new { league.Id, league.Name });
    }

    [HttpPost("{id}/join")]
    public async Task<ActionResult> Join(int id)
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return BadRequest("Claim a player first.");

        if (!await context.Leagues.AnyAsync(l => l.Id == id)) return NotFound();
        if (await Membership(id, playerId.Value) != null) return Ok(); // idempotent

        context.LeagueMemberships.Add(new LeagueMembership { LeagueId = id, PlayerId = playerId.Value, Role = Member });
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/leave")]
    public async Task<ActionResult> Leave(int id)
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return BadRequest("Claim a player first.");

        var membership = await Membership(id, playerId.Value);
        if (membership == null) return NotFound();

        if (membership.Role == Owner &&
            await context.LeagueMemberships.AnyAsync(m => m.LeagueId == id && m.PlayerId != playerId))
            return BadRequest("Delegate ownership or remove the other members before leaving.");

        context.LeagueMemberships.Remove(membership);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/claim-ownership")]
    public async Task<ActionResult> ClaimOwnership(int id)
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return BadRequest("Claim a player first.");

        var membership = await Membership(id, playerId.Value);
        if (membership == null) return BadRequest("Join the league first.");

        if (await context.LeagueMemberships.AnyAsync(m => m.LeagueId == id && m.Role == Owner))
            return BadRequest("This league already has an owner.");

        membership.Role = Owner;
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/delegate")]
    public async Task<ActionResult> Delegate(int id, [FromBody] DelegateLeagueDto dto)
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return BadRequest("Claim a player first.");

        var mine = await Membership(id, playerId.Value);
        if (mine?.Role != Owner) return BadRequest("Only the league owner can delegate ownership.");

        var target = await Membership(id, dto.PlayerId);
        if (target == null) return BadRequest("That player is not a member of this league.");
        if (target.PlayerId == playerId) return Ok();

        target.Role = Owner;
        mine.Role = Member;
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/members/{memberPlayerId}/remove")]
    public async Task<ActionResult> RemoveMember(int id, int memberPlayerId)
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return BadRequest("Claim a player first.");

        var mine = await Membership(id, playerId.Value);
        if (mine?.Role != Owner) return BadRequest("Only the league owner can remove members.");
        if (memberPlayerId == playerId) return BadRequest("Owners can't remove themselves; delegate or delete instead.");

        var target = await Membership(id, memberPlayerId);
        if (target == null) return NotFound();

        context.LeagueMemberships.Remove(target);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var playerId = await CurrentPlayerId();
        if (playerId == null) return BadRequest("Claim a player first.");

        var mine = await Membership(id, playerId.Value);
        if (mine?.Role != Owner) return BadRequest("Only the league owner can delete it.");

        if (await context.LeagueMemberships.AnyAsync(m => m.LeagueId == id && m.PlayerId != playerId))
            return BadRequest("Remove all other members before deleting the league.");

        // Sole member → wipe the league and all its data.
        var seasonIds = await context.Seasons.Where(s => s.LeagueId == id).Select(s => s.Id).ToListAsync();
        var matchIds = await context.Matches.Where(m => m.SeasonId != null && seasonIds.Contains(m.SeasonId.Value))
            .Select(m => m.Id).ToListAsync();

        context.PlayerMatches.RemoveRange(context.PlayerMatches.Where(pm => matchIds.Contains(pm.MatchId)));
        context.Matches.RemoveRange(context.Matches.Where(m => matchIds.Contains(m.Id)));
        context.PlayerSeasons.RemoveRange(context.PlayerSeasons.Where(ps => seasonIds.Contains(ps.SeasonId)));
        context.Seasons.RemoveRange(context.Seasons.Where(s => s.LeagueId == id));
        context.LeagueMemberships.RemoveRange(context.LeagueMemberships.Where(m => m.LeagueId == id));
        await context.SaveChangesAsync();

        context.Leagues.Remove((await context.Leagues.FindAsync(id))!);
        await context.SaveChangesAsync();
        return Ok();
    }
}
