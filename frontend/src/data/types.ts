export interface Game {
  id: number;
  points: Map<number, number>; // Player ID -> Score
}

export interface Player {
  id: number;
  name: string;
}

export interface Group {
  id: number;
  name: string;
  maxScore: number | null;
}
