-- Leagues: league + leagueMembership tables, season.leagueId, per-season ELO rename,
-- seed "The Foundry - CCD" with all existing seasons/players, drop the now-unused player.elo.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/****** league ******/
IF OBJECT_ID('[dbo].[league]', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[league](
        [id]              [int] IDENTITY(1,1) NOT NULL,
        [name]            [nvarchar](100) NOT NULL,
        [createdDateTime] [datetime2](7) NOT NULL CONSTRAINT [DF_league_createdDateTime] DEFAULT (SYSDATETIME()),
        [updatedDateTime] [datetime2](7) NOT NULL CONSTRAINT [DF_league_updatedDateTime] DEFAULT (SYSDATETIME()),
     CONSTRAINT [PK_league] PRIMARY KEY CLUSTERED ([id] ASC)
    );
END
GO

/****** leagueMembership ******/
IF OBJECT_ID('[dbo].[leagueMembership]', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[leagueMembership](
        [id]             [int] IDENTITY(1,1) NOT NULL,
        [leagueId]       [int] NOT NULL,
        [playerId]       [int] NOT NULL,
        [role]           [nvarchar](20) NOT NULL CONSTRAINT [DF_leagueMembership_role] DEFAULT (N'Member'),
        [joinedDateTime] [datetime2](7) NOT NULL CONSTRAINT [DF_leagueMembership_joinedDateTime] DEFAULT (SYSDATETIME()),
     CONSTRAINT [PK_leagueMembership] PRIMARY KEY CLUSTERED ([id] ASC),
     CONSTRAINT [UQ_leagueMembership] UNIQUE ([leagueId], [playerId]),
     CONSTRAINT [FK_leagueMembership_league] FOREIGN KEY([leagueId]) REFERENCES [dbo].[league]([id]),
     CONSTRAINT [FK_leagueMembership_player] FOREIGN KEY([playerId]) REFERENCES [dbo].[player]([id])
    );
END
GO

/****** seed "The Foundry - CCD" as league 1 ******/
IF NOT EXISTS (SELECT 1 FROM [dbo].[league] WHERE [id] = 1)
BEGIN
    SET IDENTITY_INSERT [dbo].[league] ON;
    INSERT INTO [dbo].[league] ([id], [name]) VALUES (1, N'The Foundry - CCD');
    SET IDENTITY_INSERT [dbo].[league] OFF;
END
GO

/****** season.leagueId: add nullable, backfill to The Foundry, then NOT NULL + FK ******/
IF COL_LENGTH('[dbo].[season]', 'leagueId') IS NULL
BEGIN
    ALTER TABLE [dbo].[season] ADD [leagueId] [int] NULL;
END
GO

UPDATE [dbo].[season] SET [leagueId] = 1 WHERE [leagueId] IS NULL;
GO

ALTER TABLE [dbo].[season] ALTER COLUMN [leagueId] [int] NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_season_league')
BEGIN
    ALTER TABLE [dbo].[season] WITH CHECK
        ADD CONSTRAINT [FK_season_league] FOREIGN KEY([leagueId]) REFERENCES [dbo].[league]([id]);
END
GO

/****** every existing player is a Member of The Foundry (no Owner — claimable) ******/
INSERT INTO [dbo].[leagueMembership] ([leagueId], [playerId], [role])
SELECT 1, p.[id], N'Member'
FROM [dbo].[player] p
WHERE NOT EXISTS (SELECT 1 FROM [dbo].[leagueMembership] m WHERE m.[leagueId] = 1 AND m.[playerId] = p.[id]);
GO

/****** rename playerSeason.finalElo -> latestElo (live per-season rating) ******/
IF COL_LENGTH('[dbo].[playerSeason]', 'finalElo') IS NOT NULL
    AND COL_LENGTH('[dbo].[playerSeason]', 'latestElo') IS NULL
BEGIN
    EXEC sp_rename 'dbo.playerSeason.finalElo', 'latestElo', 'COLUMN';
END
GO

/****** backfill PlayerSeason for active seasons from player.elo (before dropping it) ******/
INSERT INTO [dbo].[playerSeason] ([playerId], [seasonId], [startingElo], [latestElo], [matchesPlayed], [matchesWon])
SELECT p.[id], s.[id], 1000, p.[elo],
       (SELECT COUNT(*) FROM [dbo].[playerMatch] pm JOIN [dbo].[match] m ON m.[id] = pm.[matchId]
        WHERE pm.[playerId] = p.[id] AND m.[seasonId] = s.[id]),
       (SELECT COUNT(*) FROM [dbo].[playerMatch] pm JOIN [dbo].[match] m ON m.[id] = pm.[matchId]
        WHERE pm.[playerId] = p.[id] AND m.[seasonId] = s.[id] AND pm.[team] = m.[playerWonId])
FROM [dbo].[season] s
CROSS JOIN [dbo].[player] p
WHERE s.[isActive] = 1
  AND EXISTS (SELECT 1 FROM [dbo].[playerMatch] pm JOIN [dbo].[match] m ON m.[id] = pm.[matchId]
              WHERE pm.[playerId] = p.[id] AND m.[seasonId] = s.[id])
  AND NOT EXISTS (SELECT 1 FROM [dbo].[playerSeason] ps WHERE ps.[playerId] = p.[id] AND ps.[seasonId] = s.[id]);
GO

/****** drop the now-unused player.elo ******/
IF COL_LENGTH('[dbo].[player]', 'elo') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_user_elo')
        ALTER TABLE [dbo].[player] DROP CONSTRAINT [DF_user_elo];
    ALTER TABLE [dbo].[player] DROP COLUMN [elo];
END
GO
