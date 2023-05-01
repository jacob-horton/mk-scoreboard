import { useState } from "react";
import Dropdown from "../components/Dropdown";
import { Form, useLoaderData, useNavigate } from "react-router-dom";
import { Group, Player } from "../data/types";
import getIP from "../data/ip";

export async function loader({ params }: { params: { groupId: string } }) {
  const ip = getIP();
  let url = new URL(`http://${ip}:8080/groups/list_players`);
  url.searchParams.append("id", params.groupId);

  const players = await fetch(url).then(async (response) => {
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
    return players;
  });

  url = new URL(`http://${ip}:8080/groups/get`);
  url.searchParams.append("id", params.groupId);

  const group = await fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as Group);
  });

  return { group, players };
}

interface PlayerScore {
  playerId: number | null;
  score: number;
}

const AddGame = () => {
  const { group, players } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;
  const navigate = useNavigate();

  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([
    { playerId: null, score: 0 },
    { playerId: null, score: 0 },
    { playerId: null, score: 0 },
    { playerId: null, score: 0 },
  ]);

  return (
    <div className="space-y-4 p-4">
      <Form
        onSubmit={async (e) => {
          e.preventDefault();

          if (playerScores.some((p) => p.playerId === null || p.score === 0)) {
            alert(
              "Please fill in all players and scores and ensure they are valid"
            );
            return;
          }

          // Check if any duplicate ids
          if (
            new Set(playerScores.map((p) => p.playerId)).size <
            playerScores.length
          ) {
            alert("Duplicate players are not allowed");
            return;
          }

          // TODO: make adjustable
          const maxScore = 6 * 15;
          if (playerScores.some((p) => p.score > maxScore)) {
            alert(`Max possible score is ${maxScore}`);
            return;
          }

          const ip = getIP();
          await fetch(`http://${ip}:8080/game/add`, {
            method: "POST",
            body: JSON.stringify({ scores: playerScores, groupId: group.id }),
            headers: { "Content-Type": "application/json" },
          });

          navigate(`/groups/${group.id}/scoreboard`);
        }}
      >
        {Array.from(Array(4).keys()).map((i) => {
          return (
            // TODO: only allow non-selected players - disabled currently doesn't work
            <Dropdown
              key={i}
              disabled={playerScores
                .map(({ playerId }) => playerId)
                .filter((id): id is number => id !== null)}
              options={players}
              label={`Player ${i + 1}`}
              value={playerScores[i].playerId ?? undefined}
              onPlayerChange={(playerId) => {
                setPlayerScores((prev) => {
                  let curr = [...prev];
                  curr[i] = { ...curr[i], playerId };
                  return curr;
                });
              }}
              onScoreChange={(score) => {
                setPlayerScores((prev) => {
                  let curr = [...prev];
                  curr[i] = { ...curr[i], score };
                  return curr;
                });
              }}
            />
          );
        })}

        <div className="pt-4 space-x-4">
          <button
            className="px-4 py-2 rounded-lg transition bg-blue-500 text-white hover:bg-blue-400"
            type="submit"
          >
            Submit
          </button>
          <button
            className="px-4 py-2 rounded-lg transition bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={async () => {
              const ip = getIP();
              const url = new URL(`http://${ip}:8080/game/previous_players`);
              url.searchParams.append("groupId", group.id.toString());

              await fetch(url).then(async (response) => {
                if (!response.ok) {
                  throw new Error(response.statusText);
                }

                const players = await response
                  .json()
                  .then((data) => data as number[]);

                setPlayerScores((prev) => {
                  return prev.map((p, i) => ({ ...p, playerId: players[i] }));
                });
              });
            }}
            type="button"
          >
            Use previous players
          </button>
        </div>
      </Form>
    </div>
  );
};

export default AddGame;
