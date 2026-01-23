import { Challenge, Difficulty } from "../models";

export type FormattedChallenge = {
  text: string;
  n: number | null;
  difficulty: Difficulty;
  challengeId: string;
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatChallenge(challenge: Challenge): FormattedChallenge {
  if (!challenge.quantity) {
    return {
      text: challenge.text,
      n: null,
      difficulty: challenge.difficulty,
      challengeId: challenge.id,
    };
  }

  const n = randomInt(challenge.quantity.min, challenge.quantity.max);

  return {
    text: challenge.text.replace("{n}", String(n)),
    n,
    difficulty: challenge.difficulty,
    challengeId: challenge.id,
  };
}
