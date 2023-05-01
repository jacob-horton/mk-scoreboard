import React from "react";
import { SimplePlayerStats } from "../data/playerStats";

interface SimplePlayerCardProps {
  stats: SimplePlayerStats;
  idx: number;
}

const SimplePlayerCard: React.FC<SimplePlayerCardProps> = ({
  stats: { name, wins, games },
  idx,
}) => {
  return (
    <div className="bg-white text-gray-800 flex px-4 py-6 mb-3 rounded-lg border items-center drop-shadow">
      <p className="w-12 text-center pr-4 text-gray-400 text-2xl font-light">
        {idx + 1}
      </p>
      <p className="grow text-2xl font-light pr-4">{name}</p>
      <p className="w-20 text-2xl font-light">{wins}</p>
      <p className="w-36 text-2xl font-light">
        {((wins / games) * 100).toFixed(2)}%
      </p>
      <p className="w-20 text-2xl font-light">{games}</p>
    </div>
  );
};

export default SimplePlayerCard;
