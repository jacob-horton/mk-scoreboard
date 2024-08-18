import getApiAddr from "./ip";

export interface PlayerStats {
  id: number;
  name: string;
  wins: number;
  points: number;
  games: number;
  pointsPerGame: number;
  winPercentage: number;
}

export async function getHeadToHeadStats(
  playerIds: number[],
  groupId: number,
  nGames?: number,
): Promise<PlayerStats[]> {
  const apiAddr = getApiAddr();
  const url = new URL(`http://${apiAddr}/players/head_to_head`);
  url.searchParams.append("groupId", groupId.toString());
  url.searchParams.append("ids", playerIds.join(","));

  if (nGames !== undefined) {
    url.searchParams.append("n", nGames.toString());
  }

  return fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) =>
      data.map(
        (d) =>
          ({
            ...d,
            winPercentage: d.wins / d.games,
            pointsPerGame: d.points / d.games,
          }) as PlayerStats,
      ),
    );
  });
}

export async function getPlayerStats(
  groupId: number,
  nGames: number | null,
  skipMostRecent: boolean,
): Promise<PlayerStats[]> {
  const apiAddr = getApiAddr();
  const url = new URL(`http://${apiAddr}/groups/stats`);
  url.searchParams.append("id", groupId.toString());
  url.searchParams.append("skipMostRecent", skipMostRecent.toString());

  if (nGames !== null) {
    url.searchParams.append("n", nGames.toString());
  }

  return fetch(url).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) =>
      data.map(
        (d) =>
          ({
            ...d,
            winPercentage: d.wins / d.games,
            pointsPerGame: d.points / d.games,
          }) as PlayerStats,
      ),
    );
  });
}

export interface SimplePlayerStats {
  name: string;
  wins: number;
  games: number;
}

export async function getSimplePlayerStats(): Promise<SimplePlayerStats[]> {
  return [
    { name: "Rhys", wins: 11, games: 23 },
    { name: "Lethbridge", wins: 7, games: 26 },
    { name: "Doyle", wins: 6, games: 23 },
    { name: "Jacob", wins: 2, games: 12 },
    { name: "Guy", wins: 6, games: 16 },
    { name: "Sydney", wins: 1, games: 10 },
    { name: "Vanessa", wins: 1, games: 12 },
    { name: "Bence", wins: 1, games: 3 },
  ];
}

export interface PlayerStatsWithComparison {
  stats: PlayerStats;
  pointsPerGameChange: number;
  placeChange: number;
}
