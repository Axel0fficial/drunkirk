import React, { createContext, useContext, useReducer } from "react";
import type { Player } from "../domain/game/models";
import { CHALLENGES } from "../domain/game/challenges";
import { randomPick } from "../domain/game/engine/randomPick";
import { formatChallenge } from "../domain/game/engine/formatChallenge";
import { scoreForChallenge } from "../domain/game/engine/scoring";

type TurnEntry = {
  round: number;
  turnInRound: number; // 1..players.length
  playerId: string;

  challengeId: string;
  challengeText: string;
  n: number | null;
  difficulty: "easy" | "normal" | "hard" | "brutal";

  pointsAwarded: number;
  timestamp: number;
};

type GameState = {
  players: Player[];
  currentPlayerIndex: number;

  round: number;        // starts at 1
  turnInRound: number;  // 1..players.length (or 0 before game starts)

  currentTurn: TurnEntry | null;

  scores: Record<string, number>;
  history: TurnEntry[];
};

type Action =
  | { type: "ADD_PLAYER"; name: string }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "START_GAME" }
  | { type: "NEXT_TURN" }
  | { type: "SKIP_TURN" }
  | { type: "RESET_GAME" };

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function ensureScore(scores: Record<string, number>, playerId: string) {
  if (scores[playerId] == null) scores[playerId] = 0;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "ADD_PLAYER": {
      const name = normalizeName(action.name);
      if (!name) return state;

      const exists = state.players.some(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) return state;

      const newPlayer: Player = { id: makeId(), name };
      const nextScores = { ...state.scores };
      nextScores[newPlayer.id] = 0;

      return {
        ...state,
        players: [...state.players, newPlayer],
        scores: nextScores,
        currentPlayerIndex: state.players.length === 0 ? 0 : state.currentPlayerIndex,
      };
    }

    case "REMOVE_PLAYER": {
      const nextPlayers = state.players.filter((p) => p.id !== action.playerId);
      const nextScores = { ...state.scores };
      delete nextScores[action.playerId];

      const nextIndex =
        nextPlayers.length === 0 ? 0 : Math.min(state.currentPlayerIndex, nextPlayers.length - 1);

      return {
        ...state,
        players: nextPlayers,
        scores: nextScores,
        currentPlayerIndex: nextIndex,
      };
    }

    case "START_GAME": {
      if (state.players.length === 0) return state;

      // Reset counters, keep players
      return {
        ...state,
        currentPlayerIndex: 0,
        round: 1,
        turnInRound: 0,
        currentTurn: null,
        history: [],
        scores: Object.fromEntries(state.players.map((p) => [p.id, 0])),
      };
    }

    case "NEXT_TURN": {
      if (state.players.length === 0) return state;

      const player = state.players[state.currentPlayerIndex];
      if (!player) return state;

      const picked = randomPick(CHALLENGES);
      const formatted = formatChallenge(picked);

      const points = scoreForChallenge(formatted.difficulty, formatted.n);

      // Award points immediately (simple v1)
      const nextScores = { ...state.scores };
      ensureScore(nextScores, player.id);
      nextScores[player.id] += points;

      // Advance turn counters
      const nextTurnInRound = state.turnInRound + 1;
      const finishedRound = nextTurnInRound >= state.players.length;

      const entry: TurnEntry = {
        round: state.round,
        turnInRound: nextTurnInRound,
        playerId: player.id,
        challengeId: formatted.challengeId,
        challengeText: formatted.text,
        n: formatted.n,
        difficulty: formatted.difficulty,
        pointsAwarded: points,
        timestamp: Date.now(),
      };

      return {
        ...state,
        scores: nextScores,
        history: [...state.history, entry],
        currentTurn: entry,

        // Next player
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,

        // Round/turn progression
        turnInRound: finishedRound ? 0 : nextTurnInRound,
        round: finishedRound ? state.round + 1 : state.round,
      };
    }

    case "SKIP_TURN": {
        if (state.players.length === 0) return state;

        // Advance turn counters
        const nextTurnInRound = state.turnInRound + 1;
        const finishedRound = nextTurnInRound >= state.players.length;

        const nextRound = finishedRound ? state.round + 1 : state.round;
        const nextTurnCounter = finishedRound ? 0 : nextTurnInRound;

        // Advance player
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        const nextPlayer = state.players[nextPlayerIndex];
        if (!nextPlayer) return state;

        // Pick a new challenge for the next player, but award 0 points
        const picked = randomPick(CHALLENGES);
        const formatted = formatChallenge(picked);

        const entry: TurnEntry = {
            round: nextRound,
            turnInRound: nextTurnCounter === 0 ? state.players.length : nextTurnCounter, // keep display consistent
            playerId: nextPlayer.id,

            challengeId: formatted.challengeId,
            challengeText: formatted.text,
            n: formatted.n,
            difficulty: formatted.difficulty,

            pointsAwarded: 0,
            timestamp: Date.now(),
        };

        return {
            ...state,
            currentPlayerIndex: nextPlayerIndex,
            round: nextRound,
            turnInRound: nextTurnCounter,
            currentTurn: entry,
            history: [...state.history, entry], // logs skip as a 0-point turn
        };
    }



    case "RESET_GAME":
      return {
        ...state,
        currentPlayerIndex: 0,
        round: 1,
        turnInRound: 0,
        currentTurn: null,
        history: [],
        scores: Object.fromEntries(state.players.map((p) => [p.id, 0])),
      };

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  startGame: () => void;
  nextTurn: () => void;
  skipTurn: () => void;
  resetGame: () => void;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    players: [],
    currentPlayerIndex: 0,
    round: 1,
    turnInRound: 0,
    currentTurn: null,
    scores: {},
    history: [],
  });

  return (
    <GameContext.Provider
      value={{
        state,
        addPlayer: (name) => dispatch({ type: "ADD_PLAYER", name }),
        removePlayer: (playerId) => dispatch({ type: "REMOVE_PLAYER", playerId }),
        startGame: () => dispatch({ type: "START_GAME" }),
        nextTurn: () => dispatch({ type: "NEXT_TURN" }),
        skipTurn: () => dispatch({ type: "SKIP_TURN" }),
        resetGame: () => dispatch({ type: "RESET_GAME" }),
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
