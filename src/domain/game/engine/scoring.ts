import { Difficulty } from "../models";

export function difficultyMultiplier(d: Difficulty): number {
  switch (d) {
    case "easy":
      return 1;
    case "normal":
      return 2;
    case "hard":
      return 3;
    case "brutal":
      return 4;
  }
}

export function scoreForChallenge(difficulty: Difficulty, n: number | null): number {
  const base = n ?? 1;
  return base * difficultyMultiplier(difficulty);
}
