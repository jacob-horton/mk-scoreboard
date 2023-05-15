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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

async function getStats(player1Id: number, player2Id: number, groupId: number) {
  const ip = getIP();
  let url = new URL(`http://${ip}:8080/players/head_to_head_history`);
  url.searchParams.append("id1", player1Id.toString());
  url.searchParams.append("id2", player2Id.toString());
  url.searchParams.append("groupId", groupId.toString());
  url.searchParams.append("n", "20");

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
  points: Awaited<ReturnType<typeof getStats>> | null;
}

const HeadToHeadStats: React.FC<HeadToHeadStatsProps> = ({ points }) => {
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

  if (points !== null) {
    if (points.length === 0) {
      return <p>You have not had any games together yet</p>;
    }

    const title = `${points[0].name} against ${points[1].name}`;

    if (points.length === 0) {
      <Page titleBar={<h1 className="text-4xl font-light">{title}</h1>}>
        <p>You have no games in common</p>
      </Page>;
    }

    const labels = [...Array(points[0].history.length).keys()].map(
      (x) => x + 1
    );

    const hitRadius = 5;
    const colours = ["rgb(255, 99, 132)", "rgb(99, 132, 255)"];
    const data = {
      labels,
      datasets: points.map((player, i) => ({
        label: player.name,
        data: player.history,
        borderColor: colours[i],
        backgroundColor: colours[i].replace(")", ", 0.5)"),
        pointHitRadius: hitRadius,
        pointHoverRadius: hitRadius,
        tension: 0.3,
      })),
    };

    return <Line options={options} data={data} />;
  } else {
    return <></>;
  }
};

const HeadToHead = () => {
  const { group, players: allPlayers } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;

  const [players, setPlayers] = useState<(number | null)[]>([null, null]);
  const [points, setPoints] = useState<Awaited<
    ReturnType<typeof getStats>
  > | null>(null);

  useEffect(() => {
    if (!players.some((p) => p === null)) {
      async function updateStats() {
        setPoints(
          await getStats(players[0] as number, players[1] as number, group.id)
        );
      }

      updateStats();
    }
  }, [players]);

  // TODO: tidy, remove duplication
  return (
    <Page titleBar={<h1 className="text-4xl font-light">Head to Head</h1>}>
      <div className="sm:px-0 px-4">
        <p>Players</p>
        <div className="space-x-4 my-2">
          {players.map((p, i) => (
            <Dropdown
              options={allPlayers.map((p) => ({ id: p.id, value: p.name }))}
              disabled={players
                .filter((p) => p !== null)
                .map((p) => p as number)}
              value={p ?? undefined}
              name={i.toString()}
              onChange={(id) => {
                setPlayers((prev) => {
                  let newPlayers = [...prev];
                  newPlayers[i] = parseInt(id);
                  return newPlayers;
                });
              }}
              key={i}
            />
          ))}
        </div>
        <HeadToHeadStats points={points} />
      </div>
    </Page>
  );
};

export default HeadToHead;
