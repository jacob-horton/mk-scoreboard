import { useEffect, useState } from "react";
import { PlayerStats, getPlayerStats } from "../data/playerStats";
import Dropdown from "../components/Dropdown";
import { Link, useLoaderData } from "react-router-dom";
import { Player } from "../data/types";

export async function loader({ params }) {
  return { groupName: params.groupName };
}

const AddGame = () => {
  const { groupName } = useLoaderData();

  const [selectedPlayers, setSelectedPlayers] = useState<
    (number | undefined)[]
  >([undefined, undefined, undefined, undefined]);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);

  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    async function getStats() {
      return fetch("http://localhost:8080/players/list").then(
        async (response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }

          setPlayers(await response.json().then((data) => data as Player[]));
        }
      );
    }

    getStats();
  }, []);

  return (
    <div className="space-y-4 p-4">
      {Array.from(Array(4).keys()).map((i) => {
        return (
          // TODO: only allow non-selected players - disabled currently doesn't work
          <Dropdown
            key={i}
            disabled={selectedPlayers.filter((p) => p !== undefined)}
            options={players}
            label={`Player ${i + 1}`}
            onPlayerChange={(player) =>
              setSelectedPlayers((prev) => {
                prev[i] = player;
                return prev;
              })
            }
            onScoreChange={(score) =>
              setScores((prev) => {
                prev[i] = score;
                return prev;
              })
            }
          />
        );
      })}

      <div>
        <Link
          to={`/groups/${groupName}/scoreboard`}
          className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400"
          onClick={async () => {
            if (selectedPlayers.includes(undefined) || scores.includes(0)) {
              console.log("no");
              return;
            }

            const body = selectedPlayers.map((p, i) => ({
              player_id: p,
              score: scores[i],
            }));

            await fetch("http://localhost:8080/game/add", {
              method: "POST",
              body: JSON.stringify({ scores: body }),
              headers: { "Content-Type": "application/json" },
            });
          }}
        >
          Submit
        </Link>
      </div>
    </div>
  );
};

export default AddGame;
