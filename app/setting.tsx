import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { router } from "expo-router";
import { useGame } from "../src/state/gameStore";

export default function Settings() {
  const { state, addPlayer, removePlayer, resetGame, startGame } = useGame();
  const [name, setName] = useState("");

  const canStart = state.players.length >= 2;

  const hint = useMemo(() => {
    if (state.players.length === 0) return "Add at least 2 players to start.";
    if (state.players.length === 1) return "Add one more player to start.";
    return "Ready.";
  }, [state.players.length]);

  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Players</Text>
      <Text style={{ opacity: 0.8 }}>{hint}</Text>

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
          }}
        />
        <Pressable
          onPress={() => {
            addPlayer(name);
            setName("");
          }}
          style={{ paddingHorizontal: 16, justifyContent: "center", borderWidth: 1, borderRadius: 12 }}
        >
          <Text>Add</Text>
        </Pressable>
      </View>

      <FlatList
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
            }}
          >
            <Text style={{ fontSize: 18 }}>{item.name}</Text>
            <Pressable onPress={() => removePlayer(item.id)} style={{ padding: 8 }}>
              <Text>Remove</Text>
            </Pressable>
          </View>
        )}
      />

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
          }}
        >
          <Text style={{ fontSize: 18 }}>Start</Text>
        </Pressable>

        <Pressable
          onPress={resetGame}
          style={{ padding: 14, borderWidth: 1, borderRadius: 12, alignItems: "center" }}
        >
          <Text>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}
