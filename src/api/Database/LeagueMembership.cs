namespace api.Database;

public partial class LeagueMembership
{
    public int Id { get; set; }

    public int LeagueId { get; set; }

    public int PlayerId { get; set; }

    /// <summary>"Owner" or "Member".</summary>
    public string Role { get; set; } = "Member";

    public DateTime JoinedDateTime { get; set; }

    public virtual League League { get; set; } = null!;

    public virtual Player Player { get; set; } = null!;
}
