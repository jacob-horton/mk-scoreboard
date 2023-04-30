import { useEffect, useState } from "react";
import Button from "../components/Button";
import PlayerCard from "../components/PlayerCard";
import { PlayerStats, getPlayerStats } from "../data/playerStats";
import { Link, useLoaderData } from "react-router-dom";

export async function loader({ params }) {
  return { groupName: params.groupName };
}

export interface Player {
  id: number;
  name: string;
}

const Scoreboard = () => {
  const { groupName } = useLoaderData();

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

  return (
    <div className="px-4 pt-4 grow">
      <h1 className="text-4xl font-light pr-4 pb-10">{groupName}</h1>
      <div className="text-gray-400 flex px-4">
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
        <Link
          className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400"
          to={`/groups/${groupName}/add-game`}
        >
          + New Game
        </Link>
      </div>
    </div>
  );
};

export default Scoreboard;
