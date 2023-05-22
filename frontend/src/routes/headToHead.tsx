import { useLoaderData } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import getIP from "../data/ip";
import Page from "../components/Page";
import { loader } from "./functions/addGame";
import { useEffect, useState } from "react";
import Dropdown from "../components/Dropdown";
import { PlayerStats, getHeadToHeadStats } from "../data/playerStats";
import { PlayerCard } from "../components/PlayerCard";
import HeaderBar, { Sort, getSort } from "../components/HeaderBar";
import store from "store2";
import NumberGamesSelector, { NumberGames } from "../components/NumberGames";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

async function getHistory(
  playerIds: number[],
  groupId: number,
  nGames?: number
) {
  const ip = getIP();
  let url = new URL(`http://${ip}:8080/players/head_to_head_history`);
  url.searchParams.append("ids", playerIds.join(","));
  url.searchParams.append("groupId", groupId.toString());

  if (nGames !== undefined) {
    url.searchParams.append("n", nGames.toString());
  }

  const points = await fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    // TODO: Make type
    return response
      .json()
      .then(
        (data) => data as { id: number; name: string; history: number[] }[]
      );
  });

  return points;
}

interface HeadToHeadStatsProps {
  points: Awaited<ReturnType<typeof getHistory>>;
  stats: (PlayerStats | null)[];
}

const HeadToHeadStats: React.FC<HeadToHeadStatsProps> = ({ stats, points }) => {
  const [sort, setSort] = useState<Sort>({
    prop: "pointsPerGame",
    reversed: true,
  });
  const [sortedStats, setSortedStats] = useState<PlayerStats[]>(
    stats.filter((s) => s !== null).map((s) => s as PlayerStats)
  );

  useEffect(() => {
    const sortFunc = getSort(sort);
    const sortedStats = stats
      .filter((s) => s !== null)
      .map((s) => s as PlayerStats);

    sortedStats.sort(sortFunc);
    setSortedStats(sortedStats);
  }, [stats, sort]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    interaction: {
      mode: "x" as const,
      axis: "r" as const,
    },
  };

  if (points.length === 0) {
    return <p>You have not had any games together yet</p>;
  }

  const labels = [...Array(points[0].history.length).keys()].map((x) => x + 1);

  const hitRadius = 5;
  const colours = [
    "rgb(255, 59, 73)",
    "rgb(130, 59, 255)",
    "rgb(59, 255, 181)",
    "rgb(255, 194, 59)",
  ];

  const data = {
    labels,
    datasets: points.map((player, i) => ({
      label: player.name,
      data: player.history,
      borderColor: colours[i],
      backgroundColor: colours[i].replace(")", ", 0.5)"),
      pointHitRadius: hitRadius,
      pointHoverRadius: hitRadius,
      tension: store.get("graphTension") ?? 0.3,
    })),
  };

  return (
    <div className="space-y-2">
      <Line options={options} data={data} />
      <HeaderBar onSortChange={setSort} />
      {sortedStats.map((p, i) => (
        <PlayerCard stats={p} idx={i} key={p.id.toString()} />
      ))}
    </div>
  );
};

const HeadToHead = () => {
  const { group, players: allPlayers } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;

  const [players, setPlayers] = useState<(number | null)[]>(
    [...new Array(4)].map(() => null)
  );
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [points, setPoints] = useState<Awaited<ReturnType<typeof getHistory>>>(
    []
  );

  const [numberGames, setNumberGames] = useState<NumberGames>(10);

  useEffect(() => {
    async function updateStats() {
      const history = getHistory(
        players.map((p) => p as number),
        group.id,
        numberGames === "All" ? undefined : numberGames
      );
      const stats = getHeadToHeadStats(
        players.map((p) => p as number),
        group.id,
        numberGames === "All" ? undefined : numberGames
      );

      setPoints(await history);
      setStats(await stats);
    }

    updateStats();
  }, [players, numberGames]);

  return (
    <Page titleBar={<h1 className="text-4xl font-light">Head to Head</h1>}>
      <div className="sm:px-0 px-4 overflow-scroll">
        <div className="flex space-x-4 my-2 items-start">
          <div>
            <p>Players</p>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 space-x-0 md:space-x-4">
              {players.map((p, i) => (
                <Dropdown
                  className=""
                  options={allPlayers.map((p) => ({ id: p.id, value: p.name }))}
                  disableDefault={false}
                  disabled={players
                    .filter((p) => p !== null)
                    .map((p) => p as number)}
                  value={p ?? undefined}
                  name={i.toString()}
                  onChange={(id) => {
                    setPlayers((prev) => {
                      let newPlayers = [...prev];
                      newPlayers[i] = id.length === 0 ? null : parseInt(id);
                      return newPlayers;
                    });
                  }}
                  key={i}
                />
              ))}
            </div>
          </div>
          <div className="grow" />
          <NumberGamesSelector
            onGamesChange={setNumberGames}
            align="items-end"
          />
        </div>
        <HeadToHeadStats points={points} stats={stats} />
        <div className="h-4" />
      </div>
    </Page>
  );
};

export default HeadToHead;
