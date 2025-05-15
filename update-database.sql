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

-- =========================================================================
-- TRIGGERS FOR updatedDateTime
-- =========================================================================

-- Trigger for updating updatedDateTime on UPDATE for the match table
-- Drop existing trigger if it exists to avoid errors on re-run
IF OBJECT_ID ('TR_match_updatedDateTime', 'TR') IS NOT NULL
   DROP TRIGGER TR_match_updatedDateTime;
GO

CREATE TRIGGER TR_match_updatedDateTime
ON [dbo].[match]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON; -- Prevent extra result sets

    -- Check if updatedDateTime was explicitly updated to avoid potential infinite loops
    IF NOT UPDATE(updatedDateTime)
    BEGIN
        UPDATE T
        SET T.updatedDateTime = SYSDATETIME()
        FROM [dbo].[match] AS T
        INNER JOIN inserted AS i ON T.id = i.id; -- Ensure only updated rows are affected
    END
END;
GO

-- Trigger for updating updatedDateTime on UPDATE for the player table
-- Drop existing trigger if it exists
IF OBJECT_ID ('TR_player_updatedDateTime', 'TR') IS NOT NULL
   DROP TRIGGER TR_player_updatedDateTime;
GO

CREATE TRIGGER TR_player_updatedDateTime
ON [dbo].[player]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(updatedDateTime)
    BEGIN
        UPDATE T
        SET T.updatedDateTime = SYSDATETIME()
        FROM [dbo].[player] AS T
        INNER JOIN inserted AS i ON T.id = i.id;
    END
END;
GO

-- Trigger for updating updatedDateTime on UPDATE for the playerMatch table
-- Drop existing trigger if it exists
IF OBJECT_ID ('TR_playerMatch_updatedDateTime', 'TR') IS NOT NULL
   DROP TRIGGER TR_playerMatch_updatedDateTime;
GO

CREATE TRIGGER TR_playerMatch_updatedDateTime
ON [dbo].[playerMatch]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(updatedDateTime)
    BEGIN
        UPDATE T
        SET T.updatedDateTime = SYSDATETIME()
        FROM [dbo].[playerMatch] AS T
        INNER JOIN inserted AS i ON T.id = i.id;
    END
END;
GO
