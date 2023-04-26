import React from "react";
import { useState } from "react";
import Button from "./components/Button";
import SideBar from "./components/SideBar";
import { Game, Player } from "./data/types";
import PlayerCard from "./components/PlayerCard";
import { getPlayerStats } from "./data/playerStats";

const App = () => {
  const groups = ["***REMOVED***", "***REMOVED***"];
  const [selected, setSelected] = useState(0);

  const players: Player[] = [
    { id: 0, name: "***REMOVED***", games: [0, 2, 3] },
    { id: 1, name: "***REMOVED***", games: [0, 1, 2, 3] },
    { id: 2, name: "***REMOVED***", games: [2, 3] },
    { id: 3, name: "***REMOVED***", games: [4] },
  ];

  const games: Game[] = [
    {
      id: 0,
      points: new Map([
        [0, 60],
        [1, 45],
      ]),
    },
    {
      id: 1,
      points: new Map([[1, 59]]),
    },
    {
      id: 2,
      points: new Map([
        [0, 65],
        [1, 64],
        [2, 54],
      ]),
    },
    {
      id: 3,
      points: new Map([
        [0, 50],
        [1, 75],
        [2, 68],
      ]),
    },
    {
      id: 4,
      points: new Map([[3, 50]]),
    },
  ];

  const playerStats = players.map((player) => getPlayerStats(player, games));

  return (
    <div className="flex bg-gray-50">
      <SideBar
        groups={groups}
        selected={selected}
        onButtonPress={(index) => setSelected(index)}
      />

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
          <PlayerCard stats={p} idx={i} />
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
