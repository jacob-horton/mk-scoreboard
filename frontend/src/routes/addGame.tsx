import { useEffect, useState } from "react";
import Dropdown from "../components/Dropdown";
import { Link, useLoaderData } from "react-router-dom";
import { Player } from "../data/types";
import getIP from "../data/ip";

export async function loader({ params }: { params: { groupName: string } }) {
  return { groupName: params.groupName };
}

interface PlayerScore {
  playerId: number | null;
  score: number;
}

const AddGame = () => {
  const { groupName } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([
    { playerId: null, score: 0 },
    { playerId: null, score: 0 },
    { playerId: null, score: 0 },
    { playerId: null, score: 0 },
  ]);

  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    async function getStats() {
      const ip = getIP();
      return fetch(`http://${ip}:8080/players/list`).then(async (response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const players = await response.json().then((data) => data as Player[]);
        players.sort((a, b) => {
          // Put other at bottom, but sort rest alphabetically
          if (a.name == "Other") {
            return 1;
          } else if (b.name == "Other") {
            return -1;
          } else {
            return a.name < b.name ? -1 : 1;
          }
        });
        setPlayers(players);
      });
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
            disabled={[]}
            options={players}
            label={`Player ${i + 1}`}
            onPlayerChange={(playerId) => {
              setPlayerScores((prev) => {
                prev[i] = { ...prev[i], playerId };
                return prev;
              });
            }}
            onScoreChange={(score) =>
              setPlayerScores((prev) => {
                prev[i] = { ...prev[i], score };
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
            if (
              playerScores.some((p) => p.playerId === null || p.score === 0)
            ) {
              console.log("no");
              return;
            }

            const ip = getIP();
            await fetch(`http://${ip}:8080/game/add`, {
              method: "POST",
              body: JSON.stringify({ scores: playerScores }),
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
