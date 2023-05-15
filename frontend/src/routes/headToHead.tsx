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
  params: { groupId: string; player1Id: string; player2Id: string };
}) {
  const { groupId, player1Id, player2Id } = params;
  const ip = getIP();
  let url = new URL(`http://${ip}:8080/players/head_to_head_history`);
  url.searchParams.append("id1", player1Id);
  url.searchParams.append("id2", player2Id);
  url.searchParams.append("groupId", groupId);

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

const HeadToHead = () => {
  const points = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  // TODO: handle no games in common - points will be empty, so no names
  const title = `${points[0].name} against ${points[1].name}`;

  if (points.length === 0) {
    <Page titleBar={<h1 className="text-4xl font-light">{title}</h1>}>
      <p>You have no games in common</p>
    </Page>;
  }

  const labels = [...Array(points[0].history.length).keys()].map((x) => x + 1);

  const colours = ["rgb(255, 99, 132)", "rgb(99, 132, 255)"];
  const data = {
    labels,
    datasets: points.map((player, i) => ({
      label: player.name,
      data: player.history,
      borderColor: colours[i],
      backgroundColor: colours[i].replace(")", ", 0.5)"),
      tension: 0.3,
    })),
  };

  return (
    <Page titleBar={<h1 className="text-4xl font-light">{title}</h1>}>
      <Line options={options} data={data} />
    </Page>
  );
};

export default HeadToHead;
