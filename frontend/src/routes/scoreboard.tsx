import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import { PlayerStatsWithComparison, getPlayerStats } from "../data/playerStats";
import { Link, useLoaderData } from "react-router-dom";
import getIP from "../data/ip";
import { Badges, Group } from "../data/types";
import Page from "../components/Page";
import Dropdown from "../components/Dropdown";

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

async function getBadges(ids: number[], groupId: number) {
  if (ids.length == 0) {
    return new Map();
  }

  const ip = getIP();
  const url = new URL(`http://${ip}:8080/players/badges`);
  url.searchParams.append("ids", ids.join(","));
  url.searchParams.append("groupId", groupId.toString());

  return fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      return new Map();
    }

    return response.json().then((resp) => {
      const data = resp as { id: number; badges: Badges }[];
      let badgeMap: Map<number, Badges> = new Map();

      for (const badges of data) {
        badgeMap.set(badges.id, badges.badges);
      }

      return badgeMap;
    });
  });
}

const Scoreboard = () => {
  const { id: groupId, name: groupName } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;

  const [numberGames, setNumberGames] = useState<number | "All">(10);
  const numberGamesOptions: (number | "All")[] = [1, 5, 10, 25, 50, "All"];

  const [sortProp, setSortProp] = useState<string>("pointsPerGame");

  const [playerStats, setPlayerStats] = useState<PlayerStatsWithComparison[]>(
    []
  );
  useEffect(() => {
    async function getStats() {
      const number = numberGames === "All" ? null : numberGames;
      const stats = await getPlayerStats(groupId, number, false);
      const prevStats = await getPlayerStats(groupId, number, true);
      const badges = await getBadges(
        stats.map((p) => p.id),
        groupId
      );

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
            badges: { star: 0, gold: 0, silver: 0, bronze: 0 },
          } as PlayerStatsWithComparison;
        }

        const prevPlace = prevStats.indexOf(prev);
        return {
          stats: s,
          pointsPerGameChange: s.points / s.games - prev.points / prev.games,
          placeChange: place - prevPlace,
          badges: badges.get(s.id) ?? {
            star: 0,
            gold: 0,
            silver: 0,
            bronze: 0,
          },
        } as PlayerStatsWithComparison;
      });

      setPlayerStats(comparisonStats);
    }

    getStats();
  }, [groupId, numberGames, sortProp]);

  const headers = [
    { text: "No.", sort: null, className: "w-11 sm:w-14" },
    { text: "Name", sort: "name", className: "grow pr-4" },
    {
      text: "Games",
      sort: "games",
      className: "w-20 hidden xl:block",
    },
    { text: "Wins", sort: "wins", className: "w-20 hidden sm:block" },
    {
      text: "Win Percentage",
      sort: "winPercentage",
      className: "w-36 hidden sm:block",
    },
    {
      text: "Win %",
      sort: "winPercentage",
      className: "w-16 block sm:hidden",
    },
    {
      text: "Points",
      sort: "points",
      className: "w-20 hidden sm:block",
    },
    {
      text: "Points Per Game",
      sort: "pointsPerGame",
      className: "w-32 hidden sm:block",
    },
    {
      text: "Points/Game",
      sort: "pointsPerGame",
      className: "w-20 block sm:hidden",
    },
  ];

  return (
    <Page
      titleBar={
        <div className="flex justify-between w-full items-center">
          <h1 className="text-4xl font-light">{groupName}</h1>
          <div className="flex flex-col items-end pr-2">
            <p className="text-gray-800">Number of Games</p>
            <Dropdown
              name="Number of games"
              value={numberGames}
              options={numberGamesOptions.map((x) => ({
                id: x,
                value: x.toString(),
              }))}
              onChange={(val) => {
                const asNumber = Number(val);
                if (!isNaN(asNumber)) {
                  setNumberGames(asNumber);
                } else if (val === "All") {
                  setNumberGames(val);
                }
              }}
            />
          </div>
        </div>
      }
    >
      <div className="text-gray-400 flex md:px-6 px-4 text-sm sm:text-base">
        {headers.map((h) => (
          <button
            key={h.text}
            className={h.className + " text-left"}
            onClick={h.sort ? () => setSortProp(h.sort) : undefined}
          >
            {h.text}
          </button>
        ))}
      </div>

      <div className="overflow-scroll px-2 pt-1 pb-6 space-y-1 md:space-y-3">
        {playerStats.map((p, i) => (
          <div className="w-full" key={p.stats.id}>
            <Link to={`/groups/${groupId}/graphs/${p.stats.id}`}>
              <PlayerCard
                stats={p}
                idx={i}
                key={p.stats.id.toString() + " " + groupId} // TODO: fix key
                badges={p.badges}
              />
            </Link>
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 right-0 pr-4 pb-4 space-x-4">
        <Link
          className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400 whitespace-nowrap"
          to={`/groups/${groupId}/add-game`}
        >
          + New Game
        </Link>
      </div>
    </Page>
  );
};

export default Scoreboard;
