export type Difficulty = "easy" | "normal" | "hard" | "brutal";

export type NumberRange = {
  min: number;
  max: number;
};

export type Challenge = {
  id: string;

  // Template text
  text: string; // e.g. "Take {n} sips"

  difficulty: Difficulty;

  // Optional quantity parameter
  quantity?: NumberRange;
};

export type Player = {
  id: string;
  name: string;
};

export type GameSettings = {
  maxDifficulty: Difficulty;

  // Anti-repetition
  globalNoRepeatLastN: number;   // e.g., 10
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
