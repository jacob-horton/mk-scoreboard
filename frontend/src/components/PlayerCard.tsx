import React from "react";
import { PlayerStatsWithComparison } from "../data/playerStats";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { BsDash } from "react-icons/bs";
import { IconContext } from "react-icons";

interface PlayerCardProps {
  stats: PlayerStatsWithComparison;
  maxScore: number;
  idx: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  stats: {
    stats: {
      name,
      wins,
      points,
      games,
      pointsPerGame,
      winPercentage,
      maxScore,
    },
    placeChange,
    pointsPerGameChange: pointChange,
  },
  idx,
  maxScore: groupMaxScore,
}) => {
  return (
    <div className="bg-white text-gray-800 flex p-2 md:px-4 md:py-6 rounded-lg border items-center md:drop-shadow">
      <div className="w-14 pr-4 flex flex-row items-center">
        <p className="text-gray-400 text-md sm:text-lg md:text-2xl font-light">
          {idx + 1}
        </p>
        <IconContext.Provider value={{ size: "20px", className: "ml-2" }}>
          {placeChange < 0 ? (
            <RiArrowUpSLine className="text-green-500" />
          ) : placeChange > 0 ? (
            <RiArrowDownSLine className="text-red-500" />
          ) : (
            <BsDash className="text-gray-400" />
          )}
        </IconContext.Provider>
      </div>
      <p className="grow text-md sm:text-lg md:text-2xl font-light pr-4">
        {name}
        {maxScore === groupMaxScore
          ? " 🎖️ (🤓)"
          : maxScore >= groupMaxScore * 0.94
            ? " 🏅"
            : ""}
      </p>
      <p className="w-20 text-lg md:text-2xl font-light hidden xl:block">
        {games}
      </p>
      <p className="w-20 text-lg md:text-2xl font-light hidden sm:block">
        {wins}
      </p>
      <p className="w-20 sm:w-36 text-md sm:text-lg md:text-2xl font-light">
        {(winPercentage * 100).toFixed(2)}%
      </p>
      <p className="w-20 text-lg md:text-2xl font-light hidden sm:block">
        {points}
      </p>
      <div className="w-28 sm:w-32 flex flex-row items-center">
        <p className="text-md sm:text-lg md:text-2xl font-light pr-2">
          <IconContext.Provider value={{ size: "20px", className: "ml-2" }}>
            {pointChange > 0 ? (
              <RiArrowUpSLine className="w-5 mr-2 text-green-500" />
            ) : pointChange < 0 ? (
              <RiArrowDownSLine className="w-5 mr-2 text-red-500" />
            ) : (
              <BsDash className="w-5 mr-2 text-gray-400" />
            )}
          </IconContext.Provider>
        </p>
        <p className="text-md sm:text-lg md:text-2xl font-light">
          {pointsPerGame.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default PlayerCard;
