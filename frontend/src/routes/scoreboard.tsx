import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import {
  PlayerStats,
  PlayerStatsWithComparison,
  getPlayerStats,
} from "../data/playerStats";
import { Link, useLoaderData } from "react-router-dom";
import getIP from "../data/ip";
import { Group } from "../data/types";

export async function loader({ params }: { params: { groupId: string } }) {
  const ip = getIP();
  const url = new URL(`http://${ip}:8080/groups/get`);
  url.searchParams.append("id", params.groupId);

  return fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as Group);
  });
}

export interface Player {
  id: number;
  name: string;
}

type SortFunction = (p1: PlayerStats, p2: PlayerStats) => number;

const Scoreboard = () => {
  const { id, name } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  const [numberGames, setNumberGames] = useState<number | "All">(10);
  const numberGamesOptions: (number | "All")[] = [10, 50, "All"];

  const [sortProp, setSortProp] = useState<string>("pointsPerGame");

  const [playerStats, setPlayerStats] = useState<PlayerStatsWithComparison[]>(
    []
  );
  useEffect(() => {
    async function getStats() {
      const number = numberGames === "All" ? null : numberGames;
      const stats = await getPlayerStats(id, number, false);
      const prevStats = await getPlayerStats(id, number, true);

      // Sort by points per game
      stats.sort((a, b) =>
        a[sortProp] < b[sortProp]
          ? 1
          : a[sortProp] > b[sortProp]
            ? -1
            : a.id - b.id
      );
      prevStats.sort((a, b) =>
        a[sortProp] < b[sortProp]
          ? 1
          : a[sortProp] > b[sortProp]
            ? -1
            : a.id - b.id
      );

      const comparisonStats = stats.map((s, place) => {
        const prev = prevStats.find((p) => p.id === s.id);
        if (prev === undefined) {
          return {
            stats: s,
            pointsPerGameChange: 0,
            placeChange: 0,
          } as PlayerStatsWithComparison;
        }

        const prevPlace = prevStats.indexOf(prev);
        return {
          stats: s,
          pointsPerGameChange: s.points / s.games - prev.points / prev.games,
          placeChange: place - prevPlace,
        } as PlayerStatsWithComparison;
      });

      setPlayerStats(comparisonStats);
    }

    getStats();
  }, [id, numberGames, sortProp]);

  return (
    <div className="px-4 pt-4 grow flex-col flex h-screen">
      <div className="flex flex-row justify-between pb-10 items-center">
        <h1 className="text-4xl font-light">{name}</h1>
        <div className="flex flex-col items-end pr-2">
          <p className="text-gray-800">Number of Games</p>
          <select
            name="Number of Games"
            value={numberGames}
            className="w-24 px-2 py-2 rounded-lg"
            onChange={(e) => {
              const val = e.target.value;
              const asNumber = Number(val);
              if (!isNaN(asNumber)) {
                setNumberGames(asNumber);
              } else if (val === "All") {
                setNumberGames(val);
              }
            }}
          >
            {numberGamesOptions.map((val) => {
              return (
                <option key={val} value={val}>
                  {val}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <div className="text-gray-400 flex md:px-6 px-4">
        <p className="w-14">No.</p>
        <button
          className="grow pr-4 text-left"
          onClick={() => setSortProp("name")}
        >
          Name
        </button>
        <button
          className="w-20 hidden xl:block text-left"
          onClick={() => setSortProp("games")}
        >
          Games
        </button>
        <button
          className="w-20 hidden sm:block text-left"
          onClick={() => setSortProp("wins")}
        >
          Wins
        </button>
        <button
          className="w-36 hidden sm:block text-left"
          onClick={() => setSortProp("winPercentage")}
        >
          Win Percentage
        </button>
        <button
          className="w-20 block sm:hidden text-left"
          onClick={() => setSortProp("winPercentage")}
        >
          Win %
        </button>
        <button
          className="w-20 hidden sm:block text-left"
          onClick={() => setSortProp("points")}
        >
          Points
        </button>
        <button
          className="w-32 hidden sm:block text-left"
          onClick={() => setSortProp("pointsPerGame")}
        >
          Points Per Game
        </button>
        <button
          className="w-28 block sm:hidden text-left"
          onClick={() => setSortProp("pointsPerGame")}
        >
          Points/Game
        </button>
      </div>

      <div className="overflow-scroll px-2 pt-1 pb-6">
        {playerStats.map((p, i) => (
          <PlayerCard stats={p} idx={i} key={p.stats.id} />
        ))}
      </div>
      <div className="fixed bottom-0 right-0 pr-4 pb-4 space-x-4">
        <Link
          className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400 whitespace-nowrap"
          to={`/groups/${id}/add-game`}
        >
          + New Game
        </Link>
      </div>
    </div>
  );
};

export default Scoreboard;
