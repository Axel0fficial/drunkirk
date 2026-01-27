import React, { createContext, useContext, useReducer } from "react";
import { CHALLENGES } from "../domain/game/challenges";
import {
  formatChallenge,
  randomIntInRange,
} from "../domain/game/engine/formatChallenge";
import { formatTrackedText } from "../domain/game/engine/formatTracked";
import { pickChallengeWeighted } from "../domain/game/engine/pickChallengesWeighted";
import { scoreForChallenge } from "../domain/game/engine/scoring";
import type {
  ActiveTracked,
  Challenge,
  Player,
  SimpleChallenge,
  TrackedChallenge,
} from "../domain/game/models";

type TurnEntry = {
  round: number;
  turnInRound: number;
  playerId: string;

  challengeId: string;
  challengeText: string;
  difficulty: "easy" | "normal" | "hard" | "brutal";
  categories: string[];

  n: number | null;
  pointsAwarded: number;
  timestamp: number;
  isSkip?: boolean;
};

type GameState = {
  players: Player[];
  currentPlayerIndex: number;

  round: number; // starts at 1
  turnInRound: number; // 0 before first turn, then 1..players.length

  currentTurn: TurnEntry | null;

  scores: Record<string, number>;
  history: TurnEntry[];

  activeTracked: ActiveTracked[];
  advanced: AdvancedSettings;
  totalRounds: number;
};

type AdvancedSettings = {
  enabledCategories: Record<string, boolean>;
  favoriteChallenges: Record<string, boolean>;
  disabledChallenges: Record<string, boolean>; // true = disabled
};

type Action =
  | { type: "ADD_PLAYER"; name: string }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "START_GAME" }
  | { type: "NEXT_TURN" }
  | { type: "SKIP_TURN" }
  | { type: "TOGGLE_CATEGORY"; category: string }
  | { type: "TOGGLE_FAVORITE"; challengeId: string }
  | { type: "SET_TOTAL_ROUNDS"; totalRounds: number }
  | { type: "TOGGLE_CHALLENGE_ENABLED"; challengeId: string }
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

function decrementTrackedOnRoundEnd(active: ActiveTracked[]): ActiveTracked[] {
  return active
    .map((a) => ({ ...a, remainingRounds: a.remainingRounds - 1 }))
    .filter((a) => a.remainingRounds > 0);
}

function pickTargetPlayer(players: Player[], nextPlayerIndex: number): Player {
  // v1: target is the next player (consistent + easy to understand)
  return players[nextPlayerIndex];
}
function isGameOver(state: GameState) {
  return state.turnInRound === 0 && state.round > state.totalRounds;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "ADD_PLAYER": {
      const name = normalizeName(action.name);
      if (!name) return state;

      const exists = state.players.some(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );
      if (exists) return state;

      const newPlayer: Player = { id: makeId(), name };
      const nextScores = { ...state.scores, [newPlayer.id]: 0 };

      return {
        ...state,
        players: [...state.players, newPlayer],
        scores: nextScores,
        currentPlayerIndex:
          state.players.length === 0 ? 0 : state.currentPlayerIndex,
      };
    }

    case "REMOVE_PLAYER": {
      const nextPlayers = state.players.filter((p) => p.id !== action.playerId);
      const nextScores = { ...state.scores };
      delete nextScores[action.playerId];

      const nextIndex =
        nextPlayers.length === 0
          ? 0
          : Math.min(state.currentPlayerIndex, nextPlayers.length - 1);

      return {
        ...state,
        players: nextPlayers,
        scores: nextScores,
        currentPlayerIndex: nextIndex,
        activeTracked: state.activeTracked.filter(
          (a) => a.targetPlayerId !== action.playerId,
        ),
      };
    }

    case "START_GAME": {
      if (state.players.length === 0) return state;

      return {
        ...state,
        currentPlayerIndex: 0,
        round: 1,
        turnInRound: 0,
        currentTurn: null,
        history: [],
        scores: Object.fromEntries(state.players.map((p) => [p.id, 0])),
        activeTracked: [],
      };
    }
    case "TOGGLE_CATEGORY": {
      const current = state.advanced.enabledCategories[action.category];
      return {
        ...state,
        advanced: {
          ...state.advanced,
          enabledCategories: {
            ...state.advanced.enabledCategories,
            [action.category]: current === false ? true : false, // default true
          },
        },
      };
    }

    case "TOGGLE_FAVORITE": {
      const current = state.advanced.favoriteChallenges[action.challengeId];
      return {
        ...state,
        advanced: {
          ...state.advanced,
          favoriteChallenges: {
            ...state.advanced.favoriteChallenges,
            [action.challengeId]: current ? false : true,
          },
        },
      };
    }

    case "SET_TOTAL_ROUNDS": {
      const r = Math.max(1, Math.floor(action.totalRounds || 0));
      return { ...state, totalRounds: r };
    }

    case "NEXT_TURN": {
      if (isGameOver(state)) return state;

      if (state.players.length === 0) return state;

      const player = state.players[state.currentPlayerIndex];
      if (!player) return state;

      const picked = pickChallengeWeighted({
        challenges: CHALLENGES,
        favorites: state.advanced?.favoriteChallenges,
        enabledCategories: state.advanced?.enabledCategories,
        disabledChallenges: state.advanced?.disabledChallenges,
        favoriteBoost: 2,
      }) as Challenge;

      // advance counters for THIS turn
      const nextTurnInRound = state.turnInRound + 1;
      const finishedRound = nextTurnInRound >= state.players.length;

      const nextRound = finishedRound ? state.round + 1 : state.round;
      const storedTurnInRound = nextTurnInRound; // 1..players.length

      // Round-end maintenance (tracked decrement)
      const nextActiveTracked = finishedRound
        ? decrementTrackedOnRoundEnd(state.activeTracked)
        : state.activeTracked;

      let challengeText = "";
      let points = 0;
      let n: number | null = null;

      let activeTrackedAfterApply = nextActiveTracked;

      if (picked.kind === "simple") {
        const formatted = formatChallenge(picked as SimpleChallenge);
        challengeText = formatted.text;
        n = formatted.n;
        points = scoreForChallenge(formatted.difficulty, formatted.n);
      } else {
        const tracked = picked as TrackedChallenge;
        const rounds = randomIntInRange(tracked.rounds.min, tracked.rounds.max);

        // target = current player for now (or change to next/any later)
        const target = player;

        challengeText = formatTrackedText(target.name, tracked.action, rounds);

        // Create an active tracked instance
        const active: ActiveTracked = {
          id: makeId(),
          challengeId: tracked.id,
          targetPlayerId: target.id,
          action: tracked.action,
          remainingRounds: rounds,
          startedRound: state.round,
          difficulty: tracked.difficulty,
        };

        activeTrackedAfterApply = [...nextActiveTracked, active];

        // v1 scoring for tracked: difficulty multiplier * rounds
        points = scoreForChallenge(tracked.difficulty, rounds);
      }

      const nextScores = { ...state.scores };
      ensureScore(nextScores, player.id);
      nextScores[player.id] += points;

      const entry: TurnEntry = {
        round: state.round,
        turnInRound: storedTurnInRound,
        playerId: player.id,
        challengeId: picked.id,
        challengeText,
        difficulty: picked.difficulty,
        categories: picked.categories,
        n,
        pointsAwarded: points,
        timestamp: Date.now(),
      };

      return {
        ...state,
        scores: nextScores,
        history: [...state.history, entry],
        currentTurn: entry,

        // advance player
        currentPlayerIndex:
          (state.currentPlayerIndex + 1) % state.players.length,

        // round/turn counters
        turnInRound: finishedRound ? 0 : nextTurnInRound,
        round: nextRound,

        // tracked
        activeTracked: activeTrackedAfterApply,
      };
    }

    case "TOGGLE_CHALLENGE_ENABLED": {
      const currentlyDisabled =
        state.advanced.disabledChallenges[action.challengeId] === true;

      return {
        ...state,
        advanced: {
          ...state.advanced,
          disabledChallenges: {
            ...state.advanced.disabledChallenges,
            // flip disabled flag
            [action.challengeId]: !currentlyDisabled,
          },
        },
      };
    }

    case "SKIP_TURN": {
      if (isGameOver(state)) return state;

      if (state.players.length === 0) return state;

      // advance to next player + update round counters
      const nextTurnInRound = state.turnInRound + 1;
      const finishedRound = nextTurnInRound >= state.players.length;

      const nextRound = finishedRound ? state.round + 1 : state.round;
      const nextTurnCounter = finishedRound ? 0 : nextTurnInRound;

      const nextPlayerIndex =
        (state.currentPlayerIndex + 1) % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];
      if (!nextPlayer) return state;

      // Round-end maintenance (tracked decrement)
      const nextActiveTracked = finishedRound
        ? decrementTrackedOnRoundEnd(state.activeTracked)
        : state.activeTracked;

      // Reroll challenge for next player, award 0 points
      const picked = pickChallengeWeighted({
        challenges: CHALLENGES,
        favorites: state.advanced?.favoriteChallenges,
        enabledCategories: state.advanced?.enabledCategories,
        disabledChallenges: state.advanced?.disabledChallenges,
        favoriteBoost: 2,
      }) as Challenge;

      let challengeText = "";
      let n: number | null = null;

      let activeTrackedAfterApply = nextActiveTracked;

      if (picked.kind === "simple") {
        const formatted = formatChallenge(picked as SimpleChallenge);
        challengeText = formatted.text;
        n = formatted.n;
      } else {
        const tracked = picked as TrackedChallenge;
        const rounds = randomIntInRange(tracked.rounds.min, tracked.rounds.max);

        // target = the next player (since skip moved turn)
        const target = pickTargetPlayer(state.players, nextPlayerIndex);

        challengeText = formatTrackedText(target.name, tracked.action, rounds);

        const active: ActiveTracked = {
          id: makeId(),
          challengeId: tracked.id,
          targetPlayerId: target.id,
          action: tracked.action,
          remainingRounds: rounds,
          startedRound: nextRound,
          difficulty: tracked.difficulty,
        };

        activeTrackedAfterApply = [...nextActiveTracked, active];
      }

      const entry: TurnEntry = {
        round: nextRound,
        turnInRound:
          nextTurnCounter === 0 ? state.players.length : nextTurnCounter,
        playerId: nextPlayer.id,
        challengeId: picked.id,
        challengeText,
        difficulty: picked.difficulty,
        categories: picked.categories,
        n,
        pointsAwarded: 0,
        timestamp: Date.now(),
        isSkip: true,
      };

      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        round: nextRound,
        turnInRound: nextTurnCounter,
        currentTurn: entry,
        history: [...state.history, entry],
        activeTracked: activeTrackedAfterApply,
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
        activeTracked: [],
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
  toggleCategory: (category: string) => void;
  toggleFavorite: (challengeId: string) => void;
  setTotalRounds: (rounds: number) => void;
  toggleChallengeEnabled: (challengeId: string) => void;
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
    activeTracked: [],
    totalRounds: 6,
    advanced: {
      enabledCategories: {},
      favoriteChallenges: {},
      disabledChallenges: {},
    },
  });

  return (
    <GameContext.Provider
      value={{
        state,
        addPlayer: (name) => dispatch({ type: "ADD_PLAYER", name }),
        removePlayer: (playerId) =>
          dispatch({ type: "REMOVE_PLAYER", playerId }),
        startGame: () => dispatch({ type: "START_GAME" }),
        nextTurn: () => dispatch({ type: "NEXT_TURN" }),
        skipTurn: () => dispatch({ type: "SKIP_TURN" }),
        toggleCategory: (category) =>
          dispatch({ type: "TOGGLE_CATEGORY", category }),
        toggleChallengeEnabled: (challengeId) =>
          dispatch({ type: "TOGGLE_CHALLENGE_ENABLED", challengeId }),
        toggleFavorite: (challengeId) =>
          dispatch({ type: "TOGGLE_FAVORITE", challengeId }),
        resetGame: () => dispatch({ type: "RESET_GAME" }),
        setTotalRounds: (rounds) =>
          dispatch({ type: "SET_TOTAL_ROUNDS", totalRounds: rounds }),
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
