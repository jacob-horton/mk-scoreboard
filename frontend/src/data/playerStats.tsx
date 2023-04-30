import getIP from "./ip";

export interface PlayerStats {
  id: number;
  name: string;
  wins: number;
  points: number;
  games: number;
}

export async function getPlayerStats(): Promise<PlayerStats[]> {
  const ip = getIP();
  return fetch(`http://${ip}:8080/players/stats`).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as PlayerStats[]);
  });
}
