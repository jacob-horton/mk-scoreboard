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

export interface Badges {
  star: number;
  gold: number;
  silver: number;
  bronze: number;
}

export function noBadges() {
  return {
    star: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
  } as Badges;
}
