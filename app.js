const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
let db = null;

const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3006, () => {
      console.log("sever is running 3006");
    });
  } catch (e) {
    console.log(`error is:${e.message}`);
  }
};
initializerDbAndServer();
const convertObjectToResponse = (dbObject) => {
  return {
    PlayerId: dbObject.player_id,
    PlayerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const playersQuery = `select * from player_details`;
  const resultArray = await db.all(playersQuery);
  response.send(
    resultArray.map((eachPlayer) => convertObjectToResponse(eachPlayer))
  );
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `select * from player_details where player_id='${playerId}';`;
  const player = await db.get(getPlayerQuery);
  response.send(convertObjectToResponse(player));
});

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const player_details = request.body;
  const { playerName } = player_details;
  const updatePlayerDetailsQuery = `UPDATE player_details set 
    player_name='${playerName}' where player_id='${playerId}';`;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `select match_id as matchId,
    match,year from match_details where match_id='${matchId}';`;
  const match = await db.get(matchQuery);
  response.send(match);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayer = `select match_id as matchId,match,year 
  from player_match_score natural join match_details 
    where player_id=${playerId};`;
  const matches = await db.all(getMatchesOfPlayer);
  console.log(matches);
  response.send(matches);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsQuery = `SELECT
	    player_details.player_id AS playerId,
	    player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const player = await db.all(getPlayerDetailsQuery);
  response.send(player);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getScore = `select player_id as playerId,player_name as playerName,
    sum(score)as totalScore,sum(fours)as totalFours,sum(sixes) as totalSixes from player_details natural join player_match_score where player_id=${playerId};`;
  const scoreDetails = await db.get(getScore);
  response.send(scoreDetails);
});

module.exports = app;
