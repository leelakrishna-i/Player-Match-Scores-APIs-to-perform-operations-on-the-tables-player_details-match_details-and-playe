const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

app.use(express.json());

let db = null;

const createDbAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Is Running At http://localhost:3000/`);
    });
  } catch (error) {
    console.log(`DATA BASE ERROE ${error.message}`);
    process.exit(1);
  }
};

createDbAndStartServer();

const convertPlayerDetailsDbObjectToRequireObject = (DbObject) => {
  return {
    playerId: DbObject.player_id,
    playerName: DbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToRequireObject = (DbObject) => {
  return {
    matchId: DbObject.match_id,
    match: DbObject.match,
    year: DbObject.year,
  };
};

//Get all Players
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
        SELECT * FROM player_details;
    `;
  const allPlayers = await db.all(getAllPlayersQuery);
  response.send(
    allPlayers.map((eachPlayer) =>
      convertPlayerDetailsDbObjectToRequireObject(eachPlayer)
    )
  );
});

//Get Player Based On playerId
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getAllPlayersQuery = `
        SELECT * FROM player_details WHERE player_id=${playerId};
    `;
  const getPlayers = await db.get(getAllPlayersQuery);
  response.send(convertPlayerDetailsDbObjectToRequireObject(getPlayers));
});

//update player details on playerId
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
        UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//get match details on matchId
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT * FROM match_details WHERE match_id=${matchId};
    `;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchDetailsDbObjectToRequireObject(matchDetails));
});

//get match details based on playerId
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificMatchesQuery = `
        SELECT match_id,match,year FROM match_details NATURAL JOIN player_match_score WHERE player_id=${playerId};
    `;
  const allMatchesOfaPlayer = await db.all(getSpecificMatchesQuery);
  response.send(
    allMatchesOfaPlayer.map((eachMatch) =>
      convertMatchDetailsDbObjectToRequireObject(eachMatch)
    )
  );
});

//get player details on matchId
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOnMatchIdQuery = `
        SELECT * FROM player_details NATURAL JOIN player_match_score WHERE match_id=${matchId};
    `;
  const specificPlayerDetails = await db.all(getPlayersOnMatchIdQuery);
  response.send(
    specificPlayerDetails.map((eachPlayer) =>
      convertPlayerDetailsDbObjectToRequireObject(eachPlayer)
    )
  );
});

//get statistics of a player on playerId
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatisticsQuery = `
        SELECT player_id,player_name,SUM(score),SUM(fours),SUM(sixes) FROM player_details NATURAL JOIN player_match_score WHERE player_id=${playerId};
    `;
  const playerStatistics = await db.get(getPlayerStatisticsQuery);
  response.send({
    playerId: playerStatistics.player_id,
    playerName: playerStatistics.player_name,
    totalScore: playerStatistics["SUM(score)"],
    totalFours: playerStatistics["SUM(fours)"],
    totalSixes: playerStatistics["SUM(sixes)"],
  });
});

module.exports = app;
