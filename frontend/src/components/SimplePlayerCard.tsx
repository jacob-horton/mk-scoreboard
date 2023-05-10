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
    <div className="bg-white text-gray-800 flex p-2 md:px-4 md:py-6 mb-1 md:mb-3 rounded-lg border items-center md:drop-shadow">
      <p className="w-12 text-center pr-4 text-gray-400 text-2xl font-light hidden sm:block">
        {idx + 1}
      </p>
      <p className="grow text-base sm:text-2xl font-light pr-4">{name}</p>
      <p className="w-20 text-2xl font-light hidden sm:block">{wins}</p>
      <p className="w-20 sm:w-36 text-base sm:text-2xl font-light">
        {((wins / games) * 100).toFixed(2)}%
      </p>
      <p className="w-20 sm:w-36 text-base sm:text-2xl font-light">{games}</p>
    </div>
  );
};

export default SimplePlayerCard;
