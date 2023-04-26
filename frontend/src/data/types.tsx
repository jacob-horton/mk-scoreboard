export interface Game {
  id: number;
  points: Map<number, number>; // Player ID -> Score
}

export interface Player {
  id: number;
  name: string;
  games: number[]; // IDs of games
}
