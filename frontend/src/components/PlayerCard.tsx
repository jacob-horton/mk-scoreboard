import React from "react";
import { PlayerStats } from "../data/playerStats";

interface PlayerCardProps {
  stats: PlayerStats;
  idx: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  stats: { name, wins, points, games },
  idx,
}) => {
  return (
    <div className="bg-white text-gray-800 flex px-4 py-6 mb-3 rounded-lg border items-center drop-shadow">
      <p className="w-12 text-center pr-4 text-gray-400 text-2xl font-light">
        {idx + 1}
      </p>
      <p className="grow text-2xl font-light">{name}</p>
      <p className="w-20 text-2xl font-light">{wins}</p>
      <p className="w-36 text-2xl font-light">
        {((wins / games) * 100).toFixed(2)}%
      </p>
      <p className="w-20 text-2xl font-light">{points}</p>
      <p className="w-36 text-2xl font-light">{(points / games).toFixed(2)}</p>
    </div>
  );
};

export default PlayerCard;
