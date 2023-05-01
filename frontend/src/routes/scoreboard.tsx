import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import { PlayerStats, getPlayerStats } from "../data/playerStats";
import { Link, useLoaderData } from "react-router-dom";

export async function loader({ params }: { params: { groupName: string } }) {
  return { groupName: params.groupName };
}

export interface Player {
  id: number;
  name: string;
}

const Scoreboard = () => {
  const { groupName } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

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
    <div className="px-4 pt-4 grow flex-col flex h-screen">
      <h1 className="text-4xl font-light pr-4 pb-10">{groupName}</h1>
      <div className="text-gray-400 flex md:px-6 px-4">
        <p className="w-12 hidden sm:block">No.</p>
        <p className="grow pr-4">Name</p>
        <p className="w-20 hidden sm:block">Wins</p>
        <p className="w-36 hidden sm:block">Win Percentage</p>
        <p className="w-20 block sm:hidden">Win %</p>
        <p className="w-20 hidden sm:block">Points</p>
        <p className="w-36 hidden sm:block">Points Per Game</p>
        <p className="w-28 sm:w-36 block sm:hidden">Points/Game</p>
      </div>

      <div className="overflow-scroll px-2 pt-1 pb-6">
        {playerStats.map((p, i) => (
          <PlayerCard stats={p} idx={i} key={p.id} />
        ))}
      </div>
      <div className="fixed bottom-0 right-0 pr-4 pb-4 space-x-4">
        <Link
          className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400 whitespace-nowrap"
          to={`/groups/${groupName}/add-game`}
        >
          + New Game
        </Link>
      </div>
    </div>
  );
};

export default Scoreboard;
