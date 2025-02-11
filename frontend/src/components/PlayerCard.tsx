import { PlayerStats, PlayerStatsWithComparison } from "../data/playerStats";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { BsDash } from "react-icons/bs";
import { IconContext } from "react-icons";
import { Badges } from "../data/types";
import Badge from "./Badge";

interface PlayerCardWithChangeProps {
  stats: PlayerStatsWithComparison;
  badges: Badges;
  idx: number;
}

interface ChangeIconProps {
  change: number;
  className?: string;
}

const ChangeIcon: React.FC<ChangeIconProps> = ({ change, className }) => {
  return (
    <IconContext.Provider value={{ size: "20px", className }}>
      {change > 0 ? (
        <RiArrowUpSLine className="text-green-500" />
      ) : change < 0 ? (
        <RiArrowDownSLine className="text-red-500" />
      ) : (
        <BsDash className="text-gray-400" />
      )}
    </IconContext.Provider>
  );
};

export const PlayerCardWithChange: React.FC<PlayerCardWithChangeProps> = ({
  stats: { stats, placeChange, pointsPerGameChange: pointChange },
  idx,
  badges,
}) => {
  const { name, wins, points, games, pointsPerGame, winPercentage } = stats;

  return (
    <div
      className="flex items-center
      p-2 md:px-4 md:py-6
      md:drop-shadow rounded-lg border border-gray-200
      bg-white text-gray-800
      font-light text-base sm:text-lg md:text-2xl"
    >
      <div className="w-11 sm:w-14 pr-4 flex flex-row items-center">
        <p className="text-gray-400">{idx + 1}</p>
        <ChangeIcon change={-placeChange} className="ml-2" />
      </div>
      <div className="grow pr-4 whitespace-nowrap flex-row flex">
        <p>{name}</p>
        {badges.star > 0 && <Badge n={badges.star} icon="🎖️" />}
        {badges.gold > 0 && <Badge n={badges.gold} icon="🥇" />}
        {badges.silver > 0 && <Badge n={badges.silver} icon="🥈" />}
        {badges.bronze > 0 && <Badge n={badges.bronze} icon="🥉" />}
      </div>
      <p className="w-20 hidden xl:block">{games}</p>
      <p className="w-20 hidden sm:block">{wins}</p>
      <p className="w-16 sm:w-36">{(winPercentage * 100).toFixed(2)}%</p>
      <p className="w-20 hidden sm:block">{points}</p>
      <div className="w-20 sm:w-32 flex flex-row items-center space-x-2">
        <ChangeIcon change={pointChange} className="w-4 sm:2-5 sm:mr-2 ml-2" />
        <p>{pointsPerGame.toFixed(2)}</p>
      </div>
    </div>
  );
};

interface PlayerCardProps {
  stats: PlayerStats;
  badges?: Badges;
  idx: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  stats,
  idx,
  badges,
}) => {
  const { name, wins, points, games, pointsPerGame, winPercentage } = stats;

  return (
    <div
      className="flex items-center
      p-2 md:px-4 md:py-6
      md:drop-shadow rounded-lg border border-gray-200
      bg-white text-gray-800
      font-light text-base sm:text-lg md:text-2xl"
    >
      <div className="w-11 sm:w-14 pr-4 flex flex-row items-center">
        <p className="text-gray-400">{idx + 1}</p>
      </div>
      <div className="grow pr-4 whitespace-nowrap flex-row flex">
        <p>{name}</p>
        {badges && (
          <div>
            {badges.star > 0 && <Badge n={badges.star} icon="🎖️" />}
            {badges.gold > 0 && <Badge n={badges.gold} icon="🥇" />}
            {badges.silver > 0 && <Badge n={badges.silver} icon="🥈" />}
            {badges.bronze > 0 && <Badge n={badges.bronze} icon="🥉" />}
          </div>
        )}
      </div>
      <p className="w-20 hidden xl:block">{games}</p>
      <p className="w-20 hidden sm:block">{wins}</p>
      <p className="w-16 sm:w-36">{(winPercentage * 100).toFixed(2)}%</p>
      <p className="w-20 hidden sm:block">{points}</p>
      <div className="w-20 sm:w-32 flex flex-row items-center space-x-2">
        <p>{pointsPerGame.toFixed(2)}</p>
      </div>
    </div>
  );
};
