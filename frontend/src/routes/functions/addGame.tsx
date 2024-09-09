import ax from "../../data/fetch";
import { Group, Player } from "../../data/types";

export interface PlayerScore {
  playerId: number | null;
  score: number;
}

export async function loader({ params }: { params: { groupId: string } }) {
  const players = await ax.get(`/group/${params.groupId}/players`).then(async (resp) => {
    const players = resp.data as Player[];
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

  const group = await ax.get(`/group/${params.groupId}`).then(async (resp) => {
    return resp.data as Group;
  });

  return { group, players };
}

export async function canSubmit(
  playerScores: PlayerScore[],
  maxScore: number | null
) {
  if (playerScores.some((p) => p.playerId === null || p.score === 0)) {
    alert("Please fill in all players and scores and ensure they are valid");
    return false;
  }

  // Check if any duplicate ids
  if (new Set(playerScores.map((p) => p.playerId)).size < playerScores.length) {
    alert("Duplicate players are not allowed");
    return false;
  }

  if (maxScore !== null) {
    if (playerScores.some((p) => p.score > (maxScore as number))) {
      alert(`Max possible score is ${maxScore}`);
      return false;
    }
  }

  return true;
}
