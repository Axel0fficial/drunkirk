import { Challenge } from "../models";

export function randomPick(challenges: Challenge[]): Challenge {
  const index = Math.floor(Math.random() * challenges.length);
  return challenges[index];
}
