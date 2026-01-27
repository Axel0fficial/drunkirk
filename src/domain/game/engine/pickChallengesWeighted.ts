import { Challenge } from "../models";
import { difficultyBaseWeight } from "./difficultyWeights";
import { weightedPick } from "./weightedPicks";

type PickOpts = {
  challenges: Challenge[];
  favorites?: Record<string, boolean>;
  enabledCategories?: Record<string, boolean>;
  disabledChallenges?: Record<string, boolean>; // true = disabled
  favoriteBoost?: number;
};

function isCategoryEnabled(
  enabled: Record<string, boolean> | undefined,
  cat: string,
) {
  if (!enabled) return true;
  const v = enabled[cat];
  return v !== false; // default enabled
}

export function pickChallengeWeighted(opts: PickOpts): Challenge {
  const { challenges, favorites, enabledCategories, favoriteBoost = 2 } = opts;
  const enabledOnly = challenges.filter((c: any) => {
    return opts.disabledChallenges?.[c.id] !== true;
  });

  // Filter by enabled categories (if provided)
  const filtered = enabledOnly.filter((c: any) => {
    const cats: string[] = c.categories ?? [];
    if (cats.length === 0) return true;
    return cats.some((cat) => isCategoryEnabled(enabledCategories, cat));
  });

  const pool =
    filtered.length > 0
      ? filtered
      : enabledOnly.length > 0
        ? enabledOnly
        : challenges;

  const weights = pool.map((c: any) => {
    const base = difficultyBaseWeight(c.difficulty);

    const fav = favorites?.[c.id] === true;
    const favMult = fav ? favoriteBoost : 1;

    // Optional per-challenge weight override later (if you add it)
    const custom = typeof c.weight === "number" ? c.weight : 1;

    return base * favMult * custom;
  });

  return weightedPick(pool, weights);
}
