using DbUp;

namespace api;

/// <summary>
/// Applies the forward-only SQL migrations (the same files under /migrations that
/// scripts/db.sh runs) on API startup, tracked in dbo.SchemaVersions via DbUp.
/// </summary>
public static class MigrationRunner
{
    public static void Run(string connectionString, string scriptsDir, ILogger logger)
    {
        if (!Directory.Exists(scriptsDir) || Directory.GetFiles(scriptsDir, "*.sql").Length == 0)
        {
            logger.LogInformation("No migrations to apply ({Dir}).", scriptsDir);
            return;
        }

        var upgrader = DeployChanges.To
            .SqlDatabase(connectionString)
            .WithScriptsFromFileSystem(scriptsDir)
            .WithTransactionPerScript()
            .JournalToSqlTable("dbo", "SchemaVersions")
            .LogToConsole()
            .Build();

        var result = upgrader.PerformUpgrade();
        if (!result.Successful)
            throw new Exception("Database migration failed.", result.Error);

        logger.LogInformation("Database migrations up to date.");
    }
}
