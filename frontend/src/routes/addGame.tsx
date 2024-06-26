import { useState } from "react";
import PlayerScoreInput from "../components/PlayerScoreInput";
import { Form, useLoaderData, useNavigate } from "react-router-dom";
import getIP from "../data/ip";
import Page from "../components/Page";
import { PlayerScore, canSubmit, loader } from "./functions/addGame";

const AddGame = () => {
  const { group, players } = useLoaderData() as Awaited<
    ReturnType<typeof loader>
  >;
  const navigate = useNavigate();

  const numPlayers = 4;
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>(
    [...Array(numPlayers)].map(() => ({ playerId: null, score: 0 }))
  );

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!canSubmit(playerScores, group.maxScore)) {
      return;
    }

    const ip = getIP();
    await fetch(`http://${ip}:8080/game/add`, {
      method: "POST",
      body: JSON.stringify({ scores: playerScores, groupId: group.id }),
      headers: { "Content-Type": "application/json" },
    });

    navigate(`/groups/${group.id}/scoreboard`);
  };

  const handlePrevPlayers = async () => {
    const ip = getIP();
    const url = new URL(`http://${ip}:8080/game/previous_players`);
    url.searchParams.append("groupId", group.id.toString());

    await fetch(url).then(async (response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const players = await response.json().then((data) => data as number[]);

      setPlayerScores((prev) => {
        return prev.map((p, i) => ({ ...p, playerId: players[i] }));
      });
    });
  };

  const buttonClasses = "px-4 py-2 rounded-lg transition";

  return (
    <Page
      titleBar={
        <h1 className="text-4xl font-light">Add Game to {group.name}</h1>
      }
    >
      <div className="space-y-4 p-4">
        <Form onSubmit={handleSubmit}>
          {playerScores.map((_, i) => {
            return (
              <PlayerScoreInput
                key={i}
                disabled={playerScores
                  .map(({ playerId }) => playerId)
                  .filter((id): id is number => id !== null)}
                players={players}
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
              className={`${buttonClasses} bg-blue-500 text-white hover:bg-blue-400`}
              type="submit"
            >
              Submit
            </button>
            <button
              className={`${buttonClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`}
              onClick={handlePrevPlayers}
              type="button"
            >
              Use previous players
            </button>
          </div>
        </Form>
      </div>
    </Page>
  );
};

export default AddGame;
