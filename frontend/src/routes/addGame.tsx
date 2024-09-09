import { useState } from "react";
import PlayerScoreInput from "../components/PlayerScoreInput";
import { Form, useLoaderData, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import { PlayerScore, canSubmit, loader } from "./functions/addGame";
import ax from "../data/fetch";

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

    await ax.post("/game", { scores: playerScores, groupId: group.id });

    navigate(`/groups/${group.id}/scoreboard`);
  };

  const handlePrevPlayers = async () => {
    const params = new URLSearchParams();
    params.append("groupId", group.id.toString());

    await ax.get("/game/previous_players", { params }).then((resp) => {
      const players = resp.data as number[];

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
