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
import getApiAddr from "../data/ip";
import Page from "../components/Page";
import { loader } from "./functions/addGame";
import { useEffect, useState } from "react";
import Dropdown from "../components/Dropdown";
import { PlayerStats } from "../data/playerStats";
import { PlayerCard } from "../components/PlayerCard";
import HeaderBar, { Sort, getSort } from "../components/HeaderBar";
import store from "store2";
import NumberGamesSelector, { NumberGames } from "../components/NumberGames";
import ax from "../data/fetch";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type HeadToHeadHistory = {
  id: number;
  name: string;
  history: number[];
}

type HeadToHeadData = {
  playerStats: PlayerStats[];
  histories: HeadToHeadHistory[];
}

async function getHeadToHeadData(
  playerIds: number[],
  groupId: number,
  nGames?: number
): Promise<HeadToHeadData> {
  const params = new URLSearchParams();
  params.append("ids", playerIds.join(","));

  if (nGames !== undefined) {
    params.append("n", nGames.toString());
  }

  const points = await ax.get(`/group/${groupId}/head_to_head`, { params }).then((resp) => {
    if (resp.status >= 400) {
      throw new Error(resp.statusText);
    }

    return {
      playerStats: resp.data.playerStats.map((s) => ({
        ...s,
        winPercentage: s.wins / s.games,
        pointsPerGame: s.points / s.games,
      })),
      histories: resp.data.histories,
    } as HeadToHeadData;
  });

  return points;
}

interface HeadToHeadStatsProps {
  points: HeadToHeadHistory[];
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
  const [points, setPoints] = useState<HeadToHeadHistory[]>([]);

  const [numberGames, setNumberGames] = useState<NumberGames>(10);

  useEffect(() => {
    async function updateStats() {
      const { histories, playerStats } = await getHeadToHeadData(
        players.map((p) => p as number),
        group.id,
        numberGames === "All" ? undefined : numberGames
      );

      setPoints(histories);
      setStats(playerStats);
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
