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
    <div
      className="bg-white text-gray-800
      flex items-center
      p-2 md:px-4 md:py-6 mb-1 md:mb-3
      rounded-lg border md:drop-shadow
      font-light text-base sm:text-lg md:text-2xl"
    >
      <p className="w-12 text-center pr-4 text-gray-400 hidden sm:block">
        {idx + 1}
      </p>
      <p className="grow pr-4">{name}</p>
      <p className="w-20 ht hidden sm:block">{wins}</p>
      <p className="w-20 sm:w-36">{((wins / games) * 100).toFixed(2)}%</p>
      <p className="w-20 sm:w-36">{games}</p>
    </div>
  );
};

export default SimplePlayerCard;
