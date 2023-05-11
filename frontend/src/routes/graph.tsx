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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export async function loader({
  params,
}: {
  params: { groupId: string; playerId: string };
}) {
  const { groupId, playerId } = params;
  const ip = getIP();
  let url = new URL(`http://${ip}:8080/players/history`);
  url.searchParams.append("id", playerId);
  url.searchParams.append("groupId", groupId);

  const points = await fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as number[]);
  });

  url = new URL(`http://${ip}:8080/players/name`);
  url.searchParams.append("id", playerId);

  const name = await fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as string);
  });

  return { name, points };
}

const Graph = () => {
  const { name, points } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;

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

  const data = {
    labels,
    datasets: [
      {
        label: name,
        data: points,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.3,
      },
      {
        label: "Average",
        data: avgLine,
        borderColor: "rgb(99, 132, 255, 0.25)",
        backgroundColor: "rgba(99, 132, 255, 0.1)",
      },
    ],
  };

  return (
    <Page titleBar={<h1 className="text-4xl font-light">Points for {name}</h1>}>
      <Line options={options} data={data} />
    </Page>
  );
};

export default Graph;
