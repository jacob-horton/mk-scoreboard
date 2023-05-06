import { useEffect, useState } from "react";
import { SimplePlayerStats, getSimplePlayerStats } from "../data/playerStats";
import SimplePlayerCard from "../components/SimplePlayerCard";
import Page from "../components/Page";

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
    <Page titleBar={<h1 className="text-4xl font-light">Old Scores</h1>}>
      <div className="text-gray-400 flex md:px-6 px-4">
        <p className="w-12 hidden sm:block">No.</p>
        <p className="grow pr-4">Name</p>
        <p className="w-20 hidden sm:block">Wins</p>
        <p className="w-36 hidden sm:block">Win Percentage</p>
        <p className="w-20 block sm:hidden">Win %</p>
        <p className="w-20 sm:w-36">Games</p>
      </div>

      <div className="overflow-scroll px-2 pt-1 pb-6">
        {playerStats.map((p, i) => (
          <SimplePlayerCard stats={p} idx={i} key={p.name} />
        ))}
      </div>
    </Page>
  );
};

export default SimpleScoreboard;
