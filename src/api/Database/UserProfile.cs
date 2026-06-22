namespace api.Database;

public partial class UserProfile
{
    public int Id { get; set; }

    /// <summary>Auth0 subject claim — the stable account identifier.</summary>
    public string Auth0Sub { get; set; } = null!;

    public string? Email { get; set; }

    /// <summary>The claimed player, or null until the user claims/creates one.</summary>
    public int? PlayerId { get; set; }

    public DateTime CreatedDateTime { get; set; }

    public DateTime UpdatedDateTime { get; set; }

    public virtual Player? Player { get; set; }
}
