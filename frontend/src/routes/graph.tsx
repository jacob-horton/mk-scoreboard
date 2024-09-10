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
import { useEffect, useMemo, useState } from "react";
import store from "store2";
import NumberGamesSelector, { NumberGames } from "../components/NumberGames";
import { stdDev } from "../data/stats";
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

async function getScores(
  playerId: number,
  groupId: number,
  endpoint: "history" | "best_streak",
  nGames?: number
) {
  const params = new URLSearchParams();
  params.append("groupId", groupId.toString());

  if (nGames !== undefined) {
    params.append("n", nGames.toString());
  }

  return await ax.get(`/player/${playerId}/${endpoint}`, { params }).then((resp) => {
    return resp.data;
  });
}

async function getName(playerId: number) {
  return await ax.get(`/player/${playerId}`).then((resp) => {
    return resp.data.name as string;
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

interface Line {
  gradient: number;
  intercept: number;
}

function calcBestFitLine(points: number[]): Line {
  if (points.length === 0) {
    return { gradient: 0, intercept: 0 };
  }

  const y_mean = points.reduce((a, b) => a + b, 0) / points.length;
  const x_mean = (points.length + 1) / 2;

  const x_mean_square_diffs = points.map((_, i) => {
    const x = i + 1;
    return Math.pow(x - x_mean, 2);
  }).reduce((a, b) => a + b);

  const m = points.map((y, i) => {
    const x = i + 1;
    return ((x - x_mean) * (y - y_mean));
  }).reduce((a, b) => a + b) / x_mean_square_diffs;

  const c = y_mean - m * x_mean;
  return { gradient: m, intercept: c };
}

function calcBestFitPoints(points: number[]): number[] {
  const line = calcBestFitLine(points);
  const x = [...Array(points.length).keys()].map((i) => i + 1);
  return x.map((x) => line.gradient * x + line.intercept);
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

  const labels = useMemo(() => [...Array(points.length).keys()].map((x) => x + 1), [points]);

  const avg = useMemo(() => points.reduce((a, b) => a + b, 0) / points.length, [points]);
  const bestFitLine = useMemo(() => calcBestFitPoints(points), [points]);
  const bestStreakBestFitLine = useMemo(() => calcBestFitPoints(streak.scores), [streak.scores]);

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
        label: `Trend Over Last ${numberGames} Games`,
        data: bestFitLine,
        borderColor: "rgb(255, 99, 132, 0.25)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        pointRadius: 0,
        pointHitRadius: 0,
        pointHoverRadius: 0,
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
      label: "Trend Over Best Streak",
      data: bestStreakBestFitLine,
      borderColor: "rgb(99, 132, 255, 0.12)",
      backgroundColor: "rgba(99, 132, 255, 0.05)",
      pointRadius: 0,
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
            <p>Average: </p>
            <p>{avg} ± {stdDev(points).toFixed(2)}</p>
          </div>
        )}
        {showStreak && streak.scores && streak.scores.length && (
          <div className="flex flex-row space-x-2 text-gray-600 text-lg">
            <p>Best streak average: </p>
            <p>{streak.avg} ± {streak.stdDev.toFixed(2)}</p>
          </div>
        )}
        <div className="h-4" />
      </div>
    </Page>
  );
};

export default Graph;
