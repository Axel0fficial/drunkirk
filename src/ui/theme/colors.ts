export type Difficulty = "easy" | "normal" | "hard" | "brutal";

export const BasePalette = {
  background: "#0B0B10",     // near-black
  primary: "#7B3FE4",        // purple
  text: "#EDE7FF",           // soft light purple/white
  mutedText: "#B8A9E6",
  border: "#7B3FE4",
};

export const DifficultyPalettes: Record<Difficulty, {
  background: string;
  primary: string;
  accent: string;
  text: string;
}> = {
  easy: {
    background: "#102012",   // dark green-ish
    primary: "#2ECC71",      // green
    accent: "#F1C40F",       // yellow
    text: "#E9F7EF",
  },
  normal: {
    background: "#1B1308",   // dark warm
    primary: "#E67E22",      // orange
    accent: "#3498DB",       // blue
    text: "#FFF1E0",
  },
  hard: {
    background: "#1A0A0A",   // dark red
    primary: "#E74C3C",      // red
    accent: "#F5B7B1",       // light pink
    text: "#FDEDEC",
  },
  brutal: {
    background: BasePalette.background,
    primary: BasePalette.primary,
    accent: BasePalette.primary,
    text: BasePalette.text,
  },
};
