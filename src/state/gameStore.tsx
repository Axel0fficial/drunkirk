// src/state/gameStore.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

import { CHALLENGES } from "../domain/game/challenges";
import type {
  ActiveTracked,
  Challenge,
  Difficulty,
  Player,
  SimpleChallenge,
  TrackedChallenge,
} from "../domain/game/models";

// ======================
// Persistence
// ======================
const STORAGE_KEY = "drunkirk:persist:v1";

type PersistedV1 = {
  version: 1;
  savedAt: number;

  players: Player[];
  totalRounds: number;

  advanced: AdvancedSettings;
  customChallenges: CustomChallenge[];
};

async function loadPersisted(): Promise<PersistedV1 | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedV1;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function savePersisted(data: PersistedV1): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

async function clearPersisted(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ======================
// Types (store-specific)
// ======================
type AdvancedSettings = {
  enabledCategories: Record<string, boolean>; // default true unless explicitly false
  favoriteChallenges: Record<string, boolean>; // true = favorite
  disabledChallenges: Record<string, boolean>; // true = disabled/off
};

export type CustomChallenge = {
  kind: "simple";
  id: string; // custom_...
  text: string;
  difficulty: Difficulty;
  categories: string[]; // ["custom"]
};

type TurnEntry = {
  round: number;
  turnInRound: number; // 1..players.length
  playerId: string;

  challengeId: string;
  challengeText: string;
  difficulty: Difficulty;
  categories: string[];

  n: number | null;
  pointsAwarded: number;

  timestamp: number;
  isSkip?: boolean;
};

type GameState = {
  // setup
  players: Player[];
  totalRounds: number;

  advanced: AdvancedSettings;
  customChallenges: CustomChallenge[];

  // runtime
  currentPlayerIndex: number;

  round: number; // starts at 1
  turnInRound: number; // 0 before first turn, then 1..players.length

  currentTurn: TurnEntry | null;

  scores: Record<string, number>;
  history: TurnEntry[];

  activeTracked: ActiveTracked[];
};

// ======================
// Helpers
// ======================
function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function ensureScore(scores: Record<string, number>, playerId: string) {
  if (scores[playerId] == null) scores[playerId] = 0;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Difficulty weighting (tweak these any time)
function difficultyBaseWeight(d: Difficulty): number {
  switch (d) {
    case "easy":
      return 8;
    case "normal":
      return 5;
    case "hard":
      return 2;
    case "brutal":
      return 0.75;
  }
}

function weightedPick<T>(items: T[], weights: number[]): T {
  if (items.length === 0) throw new Error("weightedPick: empty items");
  if (items.length !== weights.length)
    throw new Error("weightedPick: size mismatch");

  let total = 0;
  for (const w of weights) total += Math.max(0, w);
  if (total <= 0) {
    return items[Math.floor(Math.random() * items.length)];
  }

  const r = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += Math.max(0, weights[i]);
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

// --- Category enabled default = true
function isCategoryEnabled(map: Record<string, boolean>, cat: string) {
  return map[cat] !== false;
}

// --- Scoring (simple + tracked)
function difficultyMultiplier(d: Difficulty): number {
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

function scoreFor(difficulty: Difficulty, n: number | null): number {
  const base = n ?? 1;
  return base * difficultyMultiplier(difficulty);
}

// --- Format simple challenge with {n}
function formatSimple(ch: SimpleChallenge): { text: string; n: number | null } {
  if (!ch.quantity) return { text: ch.text, n: null };
  const n = randomInt(ch.quantity.min, ch.quantity.max);
  return { text: ch.text.replace("{n}", String(n)), n };
}

// --- Format tracked text
function formatTrackedText(targetName: string, action: string, rounds: number) {
  const r = rounds === 1 ? "round" : "rounds";
  return `${targetName} has to ${action} for ${rounds} ${r}.`;
}

// --- End of round: decrement tracked rules
function decrementTrackedOnRoundEnd(active: ActiveTracked[]): ActiveTracked[] {
  return active
    .map((a) => ({ ...a, remainingRounds: a.remainingRounds - 1 }))
    .filter((a) => a.remainingRounds > 0);
}

// --- Decide if game is over: after finishing last round, you roll into round+1 with turnInRound=0
function isGameOver(state: GameState) {
  return state.turnInRound === 0 && state.round > state.totalRounds;
}

// --- Pick challenge from merged pool with filters + weights
function pickChallengeFromPool(state: GameState): Challenge {
  const poolAll = [
    ...(CHALLENGES as Challenge[]),
    ...(state.customChallenges as unknown as Challenge[]),
  ];

  // 1) Remove disabled challenges
  const enabledOnly = poolAll.filter(
    (c: any) => state.advanced.disabledChallenges?.[c.id] !== true,
  );

  // 2) Category filtering (if challenge has categories)
  const categoryFiltered = enabledOnly.filter((c: any) => {
    const cats: string[] = c.categories ?? [];
    if (cats.length === 0) return true;
    return cats.some((cat) =>
      isCategoryEnabled(state.advanced.enabledCategories ?? {}, cat),
    );
  });

  // Fallbacks to avoid empty pool
  const finalPool =
    categoryFiltered.length > 0
      ? categoryFiltered
      : enabledOnly.length > 0
        ? enabledOnly
        : poolAll;

  // 3) Weighting: difficulty + favorites boost
  const weights = finalPool.map((c: any) => {
    const base = difficultyBaseWeight(c.difficulty);
    const fav = state.advanced.favoriteChallenges?.[c.id] === true;
    const favBoost = fav ? 2 : 1; // tweak favorite boost here
    const custom = typeof c.weight === "number" ? c.weight : 1;
    return base * favBoost * custom;
  });

  return weightedPick(finalPool, weights);
}

// ======================
// Actions
// ======================
type Action =
  | {
      type: "HYDRATE";
      payload: {
        players: Player[];
        totalRounds: number;
        advanced: AdvancedSettings;
        customChallenges: CustomChallenge[];
      };
    }
  | { type: "ADD_PLAYER"; name: string }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "SET_TOTAL_ROUNDS"; totalRounds: number }
  | { type: "TOGGLE_CATEGORY"; category: string }
  | { type: "TOGGLE_FAVORITE"; challengeId: string }
  | { type: "TOGGLE_CHALLENGE_ENABLED"; challengeId: string }
  | {
      type: "ADD_CUSTOM_CHALLENGE";
      payload: { text: string; difficulty: Difficulty };
    }
  | {
      type: "EDIT_CUSTOM_CHALLENGE";
      payload: { id: string; text: string; difficulty: Difficulty };
    }
  | { type: "DELETE_CUSTOM_CHALLENGE"; payload: { id: string } }
  | { type: "START_GAME" }
  | { type: "NEXT_TURN" }
  | { type: "SKIP_TURN" }
  | { type: "RESET_GAME" }
  | { type: "RESET_ALL_SAVED" };

// ======================
// Reducer
// ======================
function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "HYDRATE": {
      const players = action.payload.players ?? [];
      const totalRounds = Math.max(
        1,
        Math.floor(action.payload.totalRounds ?? 6),
      );

      return {
        ...state,
        players,
        totalRounds,
        advanced: action.payload.advanced ?? state.advanced,
        customChallenges:
          action.payload.customChallenges ?? state.customChallenges,
      };
    }

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
          (t) => t.targetPlayerId !== action.playerId,
        ),
      };
    }

    case "SET_TOTAL_ROUNDS": {
      const r = Math.max(1, Math.floor(action.totalRounds || 0));
      return { ...state, totalRounds: r };
    }

    case "TOGGLE_CATEGORY": {
      const current = state.advanced.enabledCategories[action.category];
      return {
        ...state,
        advanced: {
          ...state.advanced,
          enabledCategories: {
            ...state.advanced.enabledCategories,
            [action.category]: current === false ? true : false,
          },
        },
      };
    }

    case "TOGGLE_FAVORITE": {
      const current =
        state.advanced.favoriteChallenges[action.challengeId] === true;
      return {
        ...state,
        advanced: {
          ...state.advanced,
          favoriteChallenges: {
            ...state.advanced.favoriteChallenges,
            [action.challengeId]: !current,
          },
        },
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
            [action.challengeId]: !currentlyDisabled, // true = disabled
          },
        },
      };
    }

    case "ADD_CUSTOM_CHALLENGE": {
      const text = action.payload.text.trim();
      if (!text) return state;

      const id = `custom_${makeId()}`;

      const newItem: CustomChallenge = {
        kind: "simple",
        id,
        text,
        difficulty: action.payload.difficulty,
        categories: ["custom"],
      };

      return {
        ...state,
        customChallenges: [newItem, ...state.customChallenges],
      };
    }

    case "EDIT_CUSTOM_CHALLENGE": {
      const text = action.payload.text.trim();
      if (!text) return state;

      return {
        ...state,
        customChallenges: state.customChallenges.map((c) =>
          c.id === action.payload.id
            ? { ...c, text, difficulty: action.payload.difficulty }
            : c,
        ),
      };
    }

    case "DELETE_CUSTOM_CHALLENGE": {
      const id = action.payload.id;

      const fav = { ...state.advanced.favoriteChallenges };
      const dis = { ...state.advanced.disabledChallenges };
      delete fav[id];
      delete dis[id];

      return {
        ...state,
        customChallenges: state.customChallenges.filter((c) => c.id !== id),
        advanced: {
          ...state.advanced,
          favoriteChallenges: fav,
          disabledChallenges: dis,
        },
      };
    }

    case "START_GAME": {
      if (state.players.length < 2) return state;

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

    case "NEXT_TURN": {
      if (state.players.length < 2) return state;
      if (isGameOver(state)) return state;

      const player = state.players[state.currentPlayerIndex];
      if (!player) return state;

      const picked = pickChallengeFromPool(state);

      // Advance counters for THIS turn
      const nextTurnInRound = state.turnInRound + 1;
      const finishedRound = nextTurnInRound >= state.players.length;

      const nextRound = finishedRound ? state.round + 1 : state.round;

      const trackedAfterRound = finishedRound
        ? decrementTrackedOnRoundEnd(state.activeTracked)
        : state.activeTracked;

      let challengeText = "";
      let n: number | null = null;
      let points = 0;

      let activeTrackedAfterApply = trackedAfterRound;

      if ((picked as any).kind === "tracked") {
        const tr = picked as TrackedChallenge;
        const rounds = randomInt(tr.rounds.min, tr.rounds.max);

        const target = player; // v1: tracked applies to current player
        challengeText = formatTrackedText(target.name, tr.action, rounds);

        const active: ActiveTracked = {
          id: makeId(),
          challengeId: tr.id,
          targetPlayerId: target.id,
          action: tr.action,
          remainingRounds: rounds,
          startedRound: state.round,
          difficulty: tr.difficulty,
        };

        activeTrackedAfterApply = [...trackedAfterRound, active];

        // scoring for tracked: rounds count used as n
        points = scoreFor(tr.difficulty, rounds);
      } else {
        const s = picked as SimpleChallenge;
        const formatted = formatSimple(s);
        challengeText = formatted.text;
        n = formatted.n;
        points = scoreFor(s.difficulty, formatted.n);
      }

      const nextScores = { ...state.scores };
      ensureScore(nextScores, player.id);
      nextScores[player.id] += points;

      const entry: TurnEntry = {
        round: state.round,
        turnInRound: nextTurnInRound,
        playerId: player.id,
        challengeId: (picked as any).id,
        challengeText,
        difficulty: (picked as any).difficulty,
        categories: ((picked as any).categories ?? []) as string[],
        n,
        pointsAwarded: points,
        timestamp: Date.now(),
      };

      return {
        ...state,
        scores: nextScores,
        history: [...state.history, entry],
        currentTurn: entry,

        currentPlayerIndex:
          (state.currentPlayerIndex + 1) % state.players.length,

        turnInRound: finishedRound ? 0 : nextTurnInRound,
        round: nextRound,

        activeTracked: activeTrackedAfterApply,
      };
    }

    case "SKIP_TURN": {
      if (state.players.length < 2) return state;
      if (isGameOver(state)) return state;

      // Advance to next player
      const nextTurnInRound = state.turnInRound + 1;
      const finishedRound = nextTurnInRound >= state.players.length;

      const nextRound = finishedRound ? state.round + 1 : state.round;
      const nextTurnCounter = finishedRound ? 0 : nextTurnInRound;

      const nextPlayerIndex =
        (state.currentPlayerIndex + 1) % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];
      if (!nextPlayer) return state;

      const trackedAfterRound = finishedRound
        ? decrementTrackedOnRoundEnd(state.activeTracked)
        : state.activeTracked;

      // Reroll a challenge for the next player, award 0 points
      const picked = pickChallengeFromPool(state);

      let challengeText = "";
      let n: number | null = null;
      let activeTrackedAfterApply = trackedAfterRound;

      if ((picked as any).kind === "tracked") {
        const tr = picked as TrackedChallenge;
        const rounds = randomInt(tr.rounds.min, tr.rounds.max);

        const target = nextPlayer;
        challengeText = formatTrackedText(target.name, tr.action, rounds);

        const active: ActiveTracked = {
          id: makeId(),
          challengeId: tr.id,
          targetPlayerId: target.id,
          action: tr.action,
          remainingRounds: rounds,
          startedRound: nextRound,
          difficulty: tr.difficulty,
        };

        activeTrackedAfterApply = [...trackedAfterRound, active];
      } else {
        const s = picked as SimpleChallenge;
        const formatted = formatSimple(s);
        challengeText = formatted.text;
        n = formatted.n;
      }

      const entry: TurnEntry = {
        round: nextRound,
        turnInRound:
          nextTurnCounter === 0 ? state.players.length : nextTurnCounter,
        playerId: nextPlayer.id,
        challengeId: (picked as any).id,
        challengeText,
        difficulty: (picked as any).difficulty,
        categories: ((picked as any).categories ?? []) as string[],
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

    case "RESET_GAME": {
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

    case "RESET_ALL_SAVED": {
      // Local reset (AsyncStorage clearing is done in provider helper)
      return {
        ...state,
        players: [],
        totalRounds: 6,
        advanced: {
          enabledCategories: {},
          favoriteChallenges: {},
          disabledChallenges: {},
        },
        customChallenges: [],
        currentPlayerIndex: 0,
        round: 1,
        turnInRound: 0,
        currentTurn: null,
        scores: {},
        history: [],
        activeTracked: [],
      };
    }

    default:
      return state;
  }
}

// ======================
// Context
// ======================
type GameContextValue = {
  state: GameState;

  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;

  startGame: () => void;
  nextTurn: () => void;
  skipTurn: () => void;
  resetGame: () => void;

  setTotalRounds: (rounds: number) => void;

  toggleCategory: (category: string) => void;
  toggleFavorite: (challengeId: string) => void;
  toggleChallengeEnabled: (challengeId: string) => void;

  addCustomChallenge: (text: string, difficulty: Difficulty) => void;
  editCustomChallenge: (
    id: string,
    text: string,
    difficulty: Difficulty,
  ) => void;
  deleteCustomChallenge: (id: string) => void;

  // optional, useful for testing
  resetAllSaved: () => Promise<void>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    players: [],
    totalRounds: 6,

    advanced: {
      enabledCategories: {},
      favoriteChallenges: {},
      disabledChallenges: {},
    },

    customChallenges: [],

    currentPlayerIndex: 0,
    round: 1,
    turnInRound: 0,
    currentTurn: null,
    scores: {},
    history: [],
    activeTracked: [],
  });

  const [hydrated, setHydrated] = useState(false);

  // Load on startup
  useEffect(() => {
    (async () => {
      const persisted = await loadPersisted();
      if (persisted) {
        dispatch({
          type: "HYDRATE",
          payload: {
            players: persisted.players ?? [],
            totalRounds: persisted.totalRounds ?? 6,
            advanced: persisted.advanced ?? {
              enabledCategories: {},
              favoriteChallenges: {},
              disabledChallenges: {},
            },
            customChallenges: persisted.customChallenges ?? [],
          },
        });
      }
      setHydrated(true);
    })();
  }, []);

  // Auto-save (debounced)
  useEffect(() => {
    if (!hydrated) return;

    const t = setTimeout(() => {
      savePersisted({
        version: 1,
        savedAt: Date.now(),
        players: state.players,
        totalRounds: state.totalRounds,
        advanced: state.advanced,
        customChallenges: state.customChallenges,
      });
    }, 300);

    return () => clearTimeout(t);
  }, [
    hydrated,
    state.players,
    state.totalRounds,
    state.advanced,
    state.customChallenges,
  ]);

  const resetAllSaved = async () => {
    await clearPersisted();
    dispatch({ type: "RESET_ALL_SAVED" });
  };

  const value: GameContextValue = {
    state,

    addPlayer: (name) => dispatch({ type: "ADD_PLAYER", name }),
    removePlayer: (playerId) => dispatch({ type: "REMOVE_PLAYER", playerId }),

    startGame: () => dispatch({ type: "START_GAME" }),
    nextTurn: () => dispatch({ type: "NEXT_TURN" }),
    skipTurn: () => dispatch({ type: "SKIP_TURN" }),
    resetGame: () => dispatch({ type: "RESET_GAME" }),

    setTotalRounds: (rounds) =>
      dispatch({ type: "SET_TOTAL_ROUNDS", totalRounds: rounds }),

    toggleCategory: (category) =>
      dispatch({ type: "TOGGLE_CATEGORY", category }),
    toggleFavorite: (challengeId) =>
      dispatch({ type: "TOGGLE_FAVORITE", challengeId }),
    toggleChallengeEnabled: (challengeId) =>
      dispatch({ type: "TOGGLE_CHALLENGE_ENABLED", challengeId }),

    addCustomChallenge: (text, difficulty) =>
      dispatch({ type: "ADD_CUSTOM_CHALLENGE", payload: { text, difficulty } }),
    editCustomChallenge: (id, text, difficulty) =>
      dispatch({
        type: "EDIT_CUSTOM_CHALLENGE",
        payload: { id, text, difficulty },
      }),
    deleteCustomChallenge: (id) =>
      dispatch({ type: "DELETE_CUSTOM_CHALLENGE", payload: { id } }),

    resetAllSaved,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
