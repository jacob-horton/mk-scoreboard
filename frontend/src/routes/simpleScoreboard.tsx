import { useEffect, useState } from "react";
import { SimplePlayerStats, getSimplePlayerStats } from "../data/playerStats";
import SimplePlayerCard from "../components/SimplePlayerCard";

const SimpleScoreboard = () => {
  const [playerStats, setPlayerStats] = useState<SimplePlayerStats[]>([]);
  useEffect(() => {
    async function getStats() {
      const stats = await getSimplePlayerStats();

      // Sort by win rate
      stats.sort((a, b) => (a.wins / a.games < b.wins / b.games ? 1 : -1));
      setPlayerStats(stats);
    }

    getStats();
  }, []);

  return (
    <div className="px-4 pt-4 grow">
      <h1 className="text-4xl font-light pr-4 pb-10">Old Scores</h1>
      <div className="text-gray-400 flex px-4">
        <p className="w-12">No.</p>
        <p className="grow pr-4">Name</p>
        <p className="w-20">Wins</p>
        <p className="w-36">Win Percentage</p>
        <p className="w-20">Games</p>
      </div>

      {playerStats.map((p, i) => (
        <SimplePlayerCard stats={p} idx={i} key={p.name} />
      ))}
    </div>
  );
};

export default SimpleScoreboard;
