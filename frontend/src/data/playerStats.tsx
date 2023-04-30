import getIP from "./ip";

export interface PlayerStats {
  id: number;
  name: string;
  wins: number;
  points: number;
  games: number;
}

export async function getPlayerStats(): Promise<PlayerStats[]> {
  const ips = getIP();
  console.log(ips);
  return fetch(`http://localhost:8080/players/stats`).then(async (response) => {
    if (!response.ok) {
      console.log("nope");
      throw new Error(response.statusText);
    }

    return response.json().then((data) => data as PlayerStats[]);
  });

  // const playerGames = games.filter(({ id }) => player.games.includes(id));
  // const wonGames = playerGames.filter(({ points }) => {
  //   const maxPoints = Math.max(...points.values());
  //   const playerPoints = points.get(player.id);
  //   return maxPoints == playerPoints;
  // });
  //
  // // TODO: handle error case
  // const points = playerGames
  //   .map(({ points }) => points.get(player.id) ?? 0)
  //   .reduce((accum, elem) => accum + elem);
  //
  // return {
  //   name: player.name,
  //   wins: wonGames.length,
  //   games: playerGames.length,
  //   points,
  // };
}
