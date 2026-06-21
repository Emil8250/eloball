-- Links an Auth0 account (sub) to a player.
-- One profile per Auth0 account (unique auth0Sub); a player can be claimed by at
-- most one profile (filtered-unique playerId). playerId is null until claimed.
IF OBJECT_ID('[dbo].[userProfile]', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[userProfile](
        [id]              [int] IDENTITY(1,1) NOT NULL,
        [auth0Sub]        [nvarchar](255) NOT NULL,
        [email]           [nvarchar](320) NULL,
        [playerId]        [int] NULL,
        [createdDateTime] [datetime2](7) NOT NULL CONSTRAINT [DF_userProfile_createdDateTime] DEFAULT (SYSDATETIME()),
        [updatedDateTime] [datetime2](7) NOT NULL CONSTRAINT [DF_userProfile_updatedDateTime] DEFAULT (SYSDATETIME()),
     CONSTRAINT [PK_userProfile] PRIMARY KEY CLUSTERED ([id] ASC),
     CONSTRAINT [UQ_userProfile_auth0Sub] UNIQUE ([auth0Sub]),
     CONSTRAINT [FK_userProfile_player] FOREIGN KEY([playerId]) REFERENCES [dbo].[player]([id])
    );

    CREATE UNIQUE INDEX [UX_userProfile_playerId]
        ON [dbo].[userProfile]([playerId]) WHERE [playerId] IS NOT NULL;
END
GO
