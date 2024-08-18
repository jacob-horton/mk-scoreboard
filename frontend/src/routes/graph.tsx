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
import Page from "../components/Page";
import { useEffect, useState } from "react";
import store from "store2";
import NumberGamesSelector, { NumberGames } from "../components/NumberGames";
import { stdDev } from "../data/stats";
import getApiAddr from "../data/ip";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

async function getScores(
  playerId: number,
  groupId: number,
  endpoint: "history" | "best_streak",
  nGames?: number
) {
  const apiAddr = getApiAddr();
  const url = new URL(`${apiAddr}/players/${endpoint}`);
  url.searchParams.append("id", playerId.toString());
  url.searchParams.append("groupId", groupId.toString());

  if (nGames !== undefined) {
    url.searchParams.append("n", nGames.toString());
  }

  return await fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return await response.json();
  });
}

async function getName(playerId: number) {
  const apiAddr = getApiAddr();
  const url = new URL(`${apiAddr}/players/name`);
  url.searchParams.append("id", playerId.toString());

  return await fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as string);
  });
}

export async function loader({
  params,
}: {
  params: { groupId: string; playerId: string };
}) {
  const { groupId, playerId } = params;

  const playerIdNum = parseInt(playerId);
  const groupIdNum = parseInt(groupId);
  const name = await getName(playerIdNum);
  return { groupId: groupIdNum, playerId: playerIdNum, name };
}

interface Streak {
  scores: number[];
  avg: number;
  stdDev: number;
}

const Graph = () => {
  const { name, groupId, playerId } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;

  const [numberGames, setNumberGames] = useState<NumberGames>(10);
  const [showStreak, setShowStreak] = useState<boolean>(false);

  const [streak, setStreak] = useState<Streak>({
    scores: [],
    avg: 0,
    stdDev: 0,
  });
  useEffect(() => {
    async function loadHistory() {
      const points = await getScores(
        playerId,
        groupId,
        "best_streak",
        numberGames === "All" ? undefined : numberGames
      );
      setStreak(points as Streak);
    }
    loadHistory();
  }, [playerId, numberGames]);

  const [points, setPoints] = useState<number[]>([]);
  useEffect(() => {
    async function loadHistory() {
      const points = await getScores(
        playerId,
        groupId,
        "history",
        numberGames === "All" ? undefined : numberGames
      );
      setPoints(points as number[]);
    }
    loadHistory();
  }, [playerId, numberGames]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const labels = [...Array(points.length).keys()].map((x) => x + 1);
  const avg = points.reduce((a, b) => a + b, 0) / points.length;
  const avgLine = new Array(points.length).fill(avg);
  const bestStreakAvgLine = new Array(points.length).fill(streak.avg);

  const hitRadius = 8;
  const data = {
    labels,
    datasets: [
      {
        label: `Last ${numberGames} Games`,
        data: points,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        pointHitRadius: hitRadius,
        pointHoverRadius: hitRadius,
        tension: store.get("graphTension") ?? 0.3,
      },
      {
        label: `Last ${numberGames} Games Average`,
        data: avgLine,
        borderColor: "rgb(255, 99, 132, 0.25)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        pointHitRadius: hitRadius,
        pointHoverRadius: hitRadius,
      },
    ],
  };

  if (showStreak) {
    data.datasets.push({
      label: "Best Streak",
      data: streak.scores,
      borderColor: "rgb(99, 132, 255, 0.25)",
      backgroundColor: "rgba(99, 132, 255, 0.1)",
      pointHitRadius: hitRadius,
      pointHoverRadius: hitRadius,
      tension: store.get("graphTension") ?? 0.3,
    });
    data.datasets.push({
      label: "Best Streak Average",
      data: bestStreakAvgLine,
      borderColor: "rgb(99, 132, 255, 0.12)",
      backgroundColor: "rgba(99, 132, 255, 0.05)",
      pointHitRadius: hitRadius,
      pointHoverRadius: hitRadius,
    });
  }

  return (
    <Page titleBar={<h1 className="text-4xl font-light">Points for {name}</h1>}>
      <div className="space-y-2 px-2 overflow-scroll h-full">
        <div className="flex flex-row justify-between">
          <NumberGamesSelector
            onGamesChange={setNumberGames}
            align="items-start"
          />
          <div className="flex flex-row items-center space-x-2">
            <input
              type="checkbox"
              checked={showStreak}
              onChange={() => setShowStreak((prev) => !prev)}
            />
            <p className="text-gray-800">Show best streak</p>
          </div>
        </div>
        <Line options={options} data={data} />
        {points && points.length && (
          <div className="flex flex-row space-x-2 text-gray-600 text-lg">
            <p>Std dev:</p>
            <p>{stdDev(points).toFixed(2)}</p>
          </div>
        )}
        {showStreak && streak.scores && streak.scores.length && (
          <div className="flex flex-row space-x-2 text-gray-600 text-lg">
            <p>Best streak std dev:</p>
            <p>{streak.stdDev.toFixed(2)}</p>
          </div>
        )}
        <div className="h-4" />
      </div>
    </Page>
  );
};

export default Graph;
