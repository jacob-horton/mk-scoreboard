import { Form, useLoaderData, useNavigate } from "react-router-dom";
import React from "react";
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
  // return {
  //   name: "bob",
  //   points: [
  //     43, 53, 56, 57, 56, 61, 61, 59, 56, 57, 54, 58, 50, 64, 58, 56, 57, 48,
  //     52, 54, 70, 43, 59,
  //   ],
  // };
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

  console.log(points);

  return { name, points };
}

const Graph = () => {
  const { name, points } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;
  // const navigate = useNavigate();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Points",
      },
    },
  };

  const labels = [...Array(points.length).keys()];

  const data = {
    labels,
    datasets: [
      {
        label: name,
        data: points,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return (
    <div>
      <Line options={options} data={data} />
    </div>
  );
};

export default Graph;
