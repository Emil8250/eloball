
API for seasons.

https://api.billigeterninger.dk/api/season
 
Og en specifik season
api.billigeterninger.dk/api/season/1
 
og den aktive season: https://api.billigeterninger.dk/api/season/active
 
Random ass AI dokumentation:
 
# SeasonController API Documentation
Base route: /api/season
Provides endpoints to manage seasons, query the active season, view leaderboards, create new seasons, and end seasons.
1. Get all seasons
 
HTTP method: GET
URL: /api/season
Description: Returns all seasons, ordered by StartDate descending (newest first).
Responses: 200 OK JSON array of Season objects.
1. Get active season
 
HTTP method: GET
URL: /api/season/active
Description: Returns the currently active season.
Responses: 200 OK A single Season object representing the active season. 404 Not Found No active season exists.
1. Get season by id
 
HTTP method: GET
URL: /api/season/{id}
Route parameters: id (int) Identifier of the season.
Description: Retrieves details for a specific season by its ID.
Responses: 200 OK The Season object with the given id. 404 Not Found No season with the given id exists.
1. Get season leaderboard
 
HTTP method: GET
URL: /api/season/{id}/leaderboard
Route parameters: id (int) Identifier of the season.
Description: Returns a leaderboard of players for the specified season, ordered by final ELO (or starting ELO if final is null), descending.
Response body (200 OK): JSON array of objects with fields: playerId (int) playerName (string) startingElo (int) finalElo (int or null) matchesPlayed (int) matchesWon (int) winRate (number, 0–1)
1. Create new season
 
HTTP method: POST
URL: /api/season
Description: Creates a new active season. All currently active seasons are automatically deactivated and their EndDate is set to the current time.
Request body (JSON): { "name": "string (required)", "startDate": "ISO 8601 datetime string (optional)" }
name: Required. The display name of the new season. startDate: Optional. If omitted or null, the server uses the current time.
Behavior:
- Finds all seasons where IsActive is true and:
    - Sets IsActive to false.
    - Sets EndDate to now.
 
- Creates a new Season with:
    - Name from the request.
    - StartDate from the request, or now if not provided.
    - IsActive = true.
    - CreatedAt = now.
 
- Saves the new season and returns it.
 
Responses: 201 Created The created Season object is returned. Location header points to /api/season/{id} for the created season.
1. End a season
 
HTTP method: POST
URL: /api/season/{id}/end
Route parameters: id (int) Identifier of the season to end.
Description: Ends the specified season, finalizes player statistics for that season, and resets player ELOs for the next season.
Behavior:
- Looks up the season by id.
- If the season does not exist, returns 404.
- If the season is already not active, returns 400.
- Sets:
    - IsActive = false
    - EndDate = now
 
- Finds all players who participated in matches belonging to this season.
- For each such player:
    - Calculates:
        - matchesPlayed in the season
        - matchesWon in the season
 
    - Creates a PlayerSeason record with:
        - PlayerId
        - SeasonId
        - StartingElo = 1000
        - FinalElo = player's current Elo
        - MatchesPlayed
        - MatchesWon
 
    - Resets the player's Elo to 1000.
 
Responses: 200 OK The updated Season object (now ended). 400 Bad Request The season is already ended. 404 Not Found No season with the given id exists.
 