import getIP from "../../data/ip";
import { Group, Player } from "../../data/types";

export interface PlayerScore {
  playerId: number | null;
  score: number;
}

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
