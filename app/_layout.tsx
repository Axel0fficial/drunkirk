import { Stack } from "expo-router";
import { GameProvider } from "../src/state/gameStore";

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </GameProvider>
  );
}
