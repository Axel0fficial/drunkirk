import { Difficulty } from "../models";

export function difficultyBaseWeight(d: Difficulty): number {
  switch (d) {
    case "easy":
      return 8; // most common
    case "normal":
      return 5;
    case "hard":
      return 2;
    case "brutal":
      return 0.75; // rare
  }
}
