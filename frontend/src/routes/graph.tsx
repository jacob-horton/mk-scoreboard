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
import Dropdown from "../components/Dropdown";
import { useEffect, useState } from "react";
import store from "store2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

async function getHistory(playerId: number, groupId: number, nGames?: number) {
  const ip = getIP();
  const url = new URL(`http://${ip}:8080/players/history`);
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

    return response.json().then((data) => data as number[]);
  });
}

async function getName(playerId: number) {
  const ip = getIP();
  const url = new URL(`http://${ip}:8080/players/name`);
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

const Graph = () => {
  const { name, groupId, playerId } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;

  const [numberGames, setNumberGames] = useState<number | "All">(10);
  const numberGamesOptions: (number | "All")[] = [1, 5, 10, 25, 50, "All"];

  const [points, setPoints] = useState<number[]>([]);
  useEffect(() => {
    async function loadHistory() {
      const points = await getHistory(
        playerId,
        groupId,
        numberGames === "All" ? undefined : numberGames
      );
      setPoints(points);
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

  const hitRadius = 8;
  const data = {
    labels,
    datasets: [
      {
        label: name,
        data: points,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        pointHitRadius: hitRadius,
        pointHoverRadius: hitRadius,
        tension: store.get("graphTension") ?? 0.3,
      },
      {
        label: "Average",
        data: avgLine,
        borderColor: "rgb(99, 132, 255, 0.25)",
        backgroundColor: "rgba(99, 132, 255, 0.1)",
        pointHitRadius: hitRadius,
        pointHoverRadius: hitRadius,
      },
    ],
  };

  return (
    <Page titleBar={<h1 className="text-4xl font-light">Points for {name}</h1>}>
      <div className="space-y-2 px-2">
        <div>
          <p>Number of Games</p>
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
        <Line options={options} data={data} />
      </div>
    </Page>
  );
};

export default Graph;
