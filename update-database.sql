-- Add createdDateTime and updatedDateTime to the match table
ALTER TABLE [dbo].[match]
ADD [createdDateTime] DATETIME2 NOT NULL CONSTRAINT DF_match_createdDateTime DEFAULT SYSDATETIME();
GO

ALTER TABLE [dbo].[match]
ADD [updatedDateTime] DATETIME2 NOT NULL CONSTRAINT DF_match_updatedDateTime DEFAULT SYSDATETIME();
GO

-- Add egg boolean column to the match table
ALTER TABLE [dbo].[match]
ADD [egg] BIT NOT NULL CONSTRAINT DF_match_egg DEFAULT 0; -- 0 represents false for BIT type
GO

-- Add createdDateTime and updatedDateTime to the player table
ALTER TABLE [dbo].[player]
ADD [createdDateTime] DATETIME2 NOT NULL CONSTRAINT DF_player_createdDateTime DEFAULT SYSDATETIME();
GO

ALTER TABLE [dbo].[player]
ADD [updatedDateTime] DATETIME2 NOT NULL CONSTRAINT DF_player_updatedDateTime DEFAULT SYSDATETIME();
GO

-- Add createdDateTime and updatedDateTime to the playerMatch table
ALTER TABLE [dbo].[playerMatch]
ADD [createdDateTime] DATETIME2 NOT NULL CONSTRAINT DF_playerMatch_createdDateTime DEFAULT SYSDATETIME();
GO

ALTER TABLE [dbo].[playerMatch]
ADD [updatedDateTime] DATETIME2 NOT NULL CONSTRAINT DF_playerMatch_updatedDateTime DEFAULT SYSDATETIME();
GO
