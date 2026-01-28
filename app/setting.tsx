import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useGame } from "../src/state/gameStore";
import { BasePalette } from "../src/ui/theme/colors";

export default function Settings() {
  const {
    state,
    addPlayer,
    removePlayer,
    resetGame,
    startGame,
    setTotalRounds,
  } = useGame();

  const [name, setName] = useState("");
  const insets = useSafeAreaInsets();

  const canStart = state.players.length >= 2;

  const hint = useMemo(() => {
    if (state.players.length === 0) return "Add at least 2 players to start.";
    if (state.players.length === 1) return "Add one more player to start.";
    return "Ready.";
  }, [state.players.length]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 24,
        paddingBottom: 24 + insets.bottom,
        backgroundColor: BasePalette.background,
        gap: 16,
      }}
    >
      <Text
        style={{ fontSize: 26, color: BasePalette.text, fontWeight: "700" }}
      >
        Players
      </Text>
      <Text style={{ opacity: 0.8, color: BasePalette.text }}>{hint}</Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Player name"
          style={{
            flex: 1,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderColor: BasePalette.primary,
            color: BasePalette.text,
          }}
        />
        <Pressable
          onPress={() => {
            addPlayer(name);
            setName("");
          }}
          style={{
            paddingHorizontal: 16,
            justifyContent: "center",
            borderWidth: 1,
            borderRadius: 12,
            borderColor: BasePalette.primary,
          }}
        >
          <Text style={{ color: BasePalette.text }}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        style={{ flex: 1, borderColor: BasePalette.primary }}
        contentContainerStyle={{ paddingBottom: 12 }}
        data={state.players}
        keyExtractor={(p) => p.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderColor: BasePalette.primary,
            }}
          >
            <Text style={{ fontSize: 18, color: BasePalette.text }}>
              {item.name}
            </Text>
            <Pressable
              onPress={() => removePlayer(item.id)}
              style={{ padding: 8, borderColor: BasePalette.primary }}
            >
              <Text style={{ color: BasePalette.text }}>Remove</Text>
            </Pressable>
          </View>
        )}
      />

      <View style={{ gap: 8 }}>
        <Text
          style={{ color: BasePalette.text, fontSize: 18, fontWeight: "600" }}
        >
          Total rounds
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            borderColor: BasePalette.primary,
          }}
        >
          <TextInput
            value={String(state.totalRounds)}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9]/g, "");
              const n = cleaned ? parseInt(cleaned, 10) : 0;
              setTotalRounds(n);
            }}
            keyboardType="number-pad"
            placeholder="6"
            style={{
              width: 100,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              textAlign: "center",
              borderColor: BasePalette.primary,
              color: BasePalette.text,
            }}
          />

          <Pressable
            onPress={() => setTotalRounds(6)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderRadius: 12,
              borderColor: BasePalette.primary,
            }}
          >
            <Text style={{ color: BasePalette.text }}>Default (6)</Text>
          </Pressable>
        </View>

        <Text style={{ opacity: 0.7, color: BasePalette.text }}>
          Game ends after {state.totalRounds} rounds.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={() => {
            startGame();
            router.push("/game");
          }}
          disabled={!canStart}
          style={{
            flex: 1,
            padding: 14,
            borderWidth: 1,
            borderRadius: 12,
            alignItems: "center",
            opacity: canStart ? 1 : 0.4,
            borderColor: BasePalette.primary,
          }}
        >
          <Text style={{ fontSize: 18, color: BasePalette.text }}>Start</Text>
        </Pressable>

        <Pressable
          onPress={resetGame}
          style={{
            padding: 14,
            borderWidth: 1,
            borderRadius: 12,
            alignItems: "center",
            borderColor: BasePalette.primary,
          }}
        >
          <Text style={{ color: BasePalette.text }}>Reset</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push("/custom")}
        style={{
          padding: 14,
          borderWidth: 2,
          borderRadius: 12,
          borderColor: BasePalette.primary,
          alignItems: "center",
        }}
      >
        <Text
          style={{ fontSize: 16, color: BasePalette.text, fontWeight: "800" }}
        >
          Custom challenges
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/advanced-settings")}
        style={{
          padding: 14,
          borderWidth: 1,
          borderRadius: 12,
          alignItems: "center",
          borderColor: BasePalette.primary,
        }}
      >
        <Text style={{ fontSize: 16, color: BasePalette.text }}>
          Advanced settings
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
