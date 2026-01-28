import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "drunkirk:persist:v1";

export type PersistedV1 = {
  version: 1;
  savedAt: number;

  players: { id: string; name: string }[];
  totalRounds: number;

  advanced: {
    enabledCategories: Record<string, boolean>;
    favoriteChallenges: Record<string, boolean>;
    disabledChallenges: Record<string, boolean>;
  };

  customChallenges: {
    kind: "simple";
    id: string;
    text: string;
    difficulty: "easy" | "normal" | "hard" | "brutal";
    categories: string[];
  }[];
};

export async function loadPersisted(): Promise<PersistedV1 | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedV1;
    if (!parsed || parsed.version !== 1) return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function savePersisted(data: PersistedV1): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore write errors (low storage, etc.)
  }
}

export async function clearPersisted(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
