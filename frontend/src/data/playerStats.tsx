import { Game, Player } from "./types";

export interface PlayerStats {
  name: string;
  wins: number;
  winPercentage: number;
  points: number;
  pointsPerGame: number;
}

export function getPlayerStats(player: Player, games: Game[]): PlayerStats {
  const playerGames = games.filter(({ id }) => player.games.includes(id));
  const wonGames = playerGames.filter(({ points }) => {
    const maxPoints = Math.max(...points.values());
    const playerPoints = points.get(player.id);
    return maxPoints == playerPoints;
  });

  // TODO: handle error case
  const points = playerGames
    .map(({ points }) => points.get(player.id) ?? 0)
    .reduce((accum, elem) => accum + elem);

  return {
    name: player.name,
    wins: wonGames.length,
    winPercentage: wonGames.length / playerGames.length,
    pointsPerGame: points / playerGames.length,
    points,
  };
}
