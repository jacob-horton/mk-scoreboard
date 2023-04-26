import React, { useEffect } from "react";
import { useState } from "react";
import Button from "./components/Button";
import SideBar from "./components/SideBar";
import PlayerCard from "./components/PlayerCard";
import { PlayerStats, getPlayerStats } from "./data/playerStats";
import TextBox from "./components/TextBox";
import Dropdown from "./components/Dropdown";

export interface Player {
  id: number;
  name: string;
}

const App = () => {
  const groups = ["***REMOVED***", "***REMOVED***"];
  const [selected, setSelected] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState<
    (number | undefined)[]
  >([undefined, undefined, undefined, undefined]);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);

  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  useEffect(() => {
    async function getStats() {
      const stats = await getPlayerStats();

      // Sort by points per game
      stats.sort((a, b) => (a.points / a.games < b.points / b.games ? 1 : -1));
      setPlayerStats(stats);
    }

    getStats();
  }, []);

  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    async function getStats() {
      return fetch("http://localhost:8080/players/list").then(
        async (response) => {
          if (!response.ok) {
            console.log("nope");
            throw new Error(response.statusText);
          }

          setPlayers(await response.json().then((data) => data as Player[]));
        }
      );
    }

    getStats();
  }, []);

  return (
    <div className="flex bg-gray-50">
      <SideBar
        groups={groups}
        selected={selected}
        onButtonPress={(index) => setSelected(index)}
      />

      <div className="space-y-4 p-4">
        {Array.from(Array(4).keys()).map((i) => {
          return (
            <Dropdown
              options={players}
              label={`Player ${i + 1}`}
              onPlayerChange={(player) =>
                setSelectedPlayers((prev) => {
                  prev[i] = player;
                  return prev;
                })
              }
              onScoreChange={(score) =>
                setScores((prev) => {
                  prev[i] = score;
                  return prev;
                })
              }
            />
          );
        })}

        <button
          className="bg-gray-200"
          onClick={async () => {
            const body = selectedPlayers.map((p, i) => ({
              player_id: p,
              score: scores[i],
            }));

            let resp = await fetch("http://localhost:8080/game/add", {
              method: "POST",
              body: JSON.stringify({ scores: body }),
              headers: { "Content-Type": "application/json" },
            });

            console.log(JSON.stringify(resp.body));
          }}
        >
          Submit
        </button>
      </div>

      <div className="grow">
        <div className="text-gray-400 flex px-8 pt-4">
          <p className="w-10">No.</p>
          <p className="grow pr-4">Name</p>
          <p className="w-16">Wins</p>
          <p className="w-32">Win Percentage</p>
          <p className="w-16">Points</p>
          <p className="w-32">Points Per Game</p>
        </div>

        {playerStats.map((p, i) => (
          <PlayerCard stats={p} idx={i} key={p.id} />
        ))}
        <div className="fixed bottom-0 right-0 pr-4 pb-4 space-x-4">
          <Button style="grey">+ New Player</Button>
          <Button style="blue">+ New Game</Button>
        </div>
      </div>
    </div>
  );
};

export default App;
