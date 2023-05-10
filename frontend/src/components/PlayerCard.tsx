import React, { useEffect, useState } from "react";
import { PlayerStatsWithComparison } from "../data/playerStats";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { BsDash } from "react-icons/bs";
import { IconContext } from "react-icons";
import getIP from "../data/ip";
import { Badges } from "../data/types";
import Badge from "./Badge";

interface PlayerCardProps {
  stats: PlayerStatsWithComparison;
  groupId: number;
  idx: number;
}

async function getBadges(id: number, groupId: number) {
  const ip = getIP();
  const url = new URL(`http://${ip}:8080/players/badges`);
  url.searchParams.append("id", id.toString());
  url.searchParams.append("groupId", groupId.toString());

  return fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      return { bronze: 0, silver: 0, gold: 0, star: 0 } as Badges;
    }

    return response.json().then((data) => data as Badges);
  });
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  stats: { stats, placeChange, pointsPerGameChange: pointChange },
  idx,
  groupId,
}) => {
  const { id, name, wins, points, games, pointsPerGame, winPercentage } = stats;
  const [badges, setBadges] = useState<Badges>({
    bronze: 0,
    silver: 0,
    gold: 0,
    star: 0,
  });

  // TODO: update whenever overall games changes
  useEffect(() => {
    getBadges(id, groupId).then((badges) => setBadges(badges));
  }, [stats]);

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
      <div className="grow text-md sm:text-lg md:text-2xl font-light pr-4 whitespace-nowrap flex-row flex">
        <p>{name}</p>
        {badges.star > 0 && <Badge n={badges.star} icon="🎖️" />}
        {badges.gold > 0 && <Badge n={badges.gold} icon="🥇" />}
        {badges.silver > 0 && <Badge n={badges.silver} icon="🥈" />}
        {badges.bronze > 0 && <Badge n={badges.bronze} icon="🥉" />}
      </div>
      <p className="w-20 text-lg md:text-2xl font-light hidden xl:block">
        {games}
      </p>
      <p className="w-20 text-lg md:text-2xl font-light hidden sm:block">
        {wins}
      </p>
      <p className="w-16 sm:w-36 text-md sm:text-lg md:text-2xl font-light">
        {(winPercentage * 100).toFixed(2)}%
      </p>
      <p className="w-20 text-lg md:text-2xl font-light hidden sm:block">
        {points}
      </p>
      <div className="w-24 sm:w-32 flex flex-row items-center">
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
