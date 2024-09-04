import { useEffect, useState } from "react";
import { PlayerCardWithChange } from "../components/PlayerCard";
import {
  PlayerStats,
  PlayerStatsWithComparison,
  getPlayerStats,
} from "../data/playerStats";
import { Link, useLoaderData } from "react-router-dom";
import getApiAddr from "../data/ip";
import { Badges, Group, noBadges } from "../data/types";
import Page from "../components/Page";
import HeaderBar, { Sort, getSort } from "../components/HeaderBar";
import NumberGamesSelector, { NumberGames } from "../components/NumberGames";
import store from "store2";

export async function loader({ params }: { params: { groupId: string } }) {
  const apiAddr = getApiAddr();
  const url = new URL(`${apiAddr}/group/${params.groupId}`);

  store.set('lastGroup', params.groupId);

  return fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as Group);
  });
}

async function getBadges(groupId: number) {
  const apiAddr = getApiAddr();
  const url = new URL(`${apiAddr}/group/${groupId}/badges`);

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

  const [numberGames, setNumberGames] = useState<NumberGames>(10);
  const [badges, setBadges] = useState<Map<number, Badges>>(new Map());

  const [sort, setSort] = useState<Sort>({
    prop: "pointsPerGame",
    reversed: true,
  });

  const [detailedPlayerStats, setDetailedPlayerStats] = useState<
    PlayerStatsWithComparison[]
  >([]);

  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [prevPlayerStats, setPrevPlayerStats] = useState<PlayerStats[]>([]);
  useEffect(() => {
    async function getStats() {
      const number = numberGames === "All" ? null : numberGames;
      const stats = await getPlayerStats(groupId, number, false);
      const prevStats = await getPlayerStats(groupId, number, true);

      setPlayerStats(stats);
      setPrevPlayerStats(prevStats);

      const badges = await getBadges(groupId);

      setBadges(badges);
    }

    getStats();
  }, [groupId, numberGames]);

  useEffect(() => {
    const sortFunc = getSort(sort);
    const stats = [...playerStats];
    const prevStats = [...prevPlayerStats];

    stats.sort(sortFunc);
    prevStats.sort(sortFunc);

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

    setDetailedPlayerStats(comparisonStats);
  }, [playerStats, prevPlayerStats, sort]);

  return (
    <Page
      titleBar={
        <div className="flex justify-between w-full items-center">
          <h1 className="text-4xl font-light">{groupName}</h1>
          <div className="px-4">
            <NumberGamesSelector
              onGamesChange={setNumberGames}
              align="items-end"
            />
          </div>
        </div>
      }
    >
      <HeaderBar onSortChange={setSort} />

      <div className="overflow-scroll px-2 pt-1 pb-6 space-y-1 md:space-y-3">
        {detailedPlayerStats.map((p, i) => (
          <div className="w-full" key={p.stats.id}>
            <Link to={`/groups/${groupId}/graphs/${p.stats.id}`}>
              <PlayerCardWithChange
                stats={p}
                idx={i}
                key={p.stats.id.toString() + " " + groupId} // TODO: fix key
                badges={badges.get(p.stats.id) ?? noBadges()}
              />
            </Link>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 right-0 pr-4 pb-4 space-x-4">
        <Link
          className="px-4 py-2 rounded-lg transition bg-gray-200 hover:bg-gray-300 whitespace-nowrap"
          to={`/groups/${groupId}/add_player`}
        >
          Modify Players
        </Link>
        <Link
          className="px-4 py-2 rounded-lg transition bg-gray-200 hover:bg-gray-300 whitespace-nowrap"
          to={`/groups/${groupId}/head_to_head`}
        >
          Head to Head
        </Link>
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
