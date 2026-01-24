export type Difficulty = "easy" | "normal" | "hard" | "brutal";

export type NumberRange = {
  min: number;
  max: number;
};

export type Player = {
  id: string;
  name: string;
};

export type ChallengeCategory =
  | "sips"
  | "social"
  | "rule"
  | "minigame"
  | "wildcard";

export type SimpleChallenge = {
  kind: "simple";
  id: string;
  text: string;
  difficulty: Difficulty;
  quantity?: NumberRange;
  categories: ChallengeCategory[];
};

export type TrackedChallenge = {
  kind: "tracked";
  id: string;
  difficulty: Difficulty;
  action: string;
  rounds: NumberRange;
  categories: ChallengeCategory[];
};

export type Challenge = SimpleChallenge | TrackedChallenge;

export type ActiveTracked = {
  id: string; // unique active instance id
  challengeId: string;
  targetPlayerId: string;

  action: string;
  remainingRounds: number;

  startedRound: number; // round number when applied
  difficulty: Difficulty;
};

export type GameSettings = {
  maxDifficulty: Difficulty;

  // Anti-repetition
  globalNoRepeatLastN: number; // e.g., 10
  perPlayerNoRepeatLastN: number; // e.g., 5

  // Cooldowns
  challengeCooldownTurns: number; // e.g., 8

  // Favorites influence
  favoriteBoost: number; // e.g., 1.5 means +50% weight
};

export type HistoryEntry = {
  turn: number;
  timestamp: number;

  playerId: string;
  challengeId: string;

  difficulty: Difficulty;
};
