import { View, Text, Pressable, FlatList } from "react-native";
import { router } from "expo-router";
import { useGame } from "../src/state/gameStore";

export default function Game() {
  const { state, nextTurn,skipTurn  } = useGame();

  if (state.players.length < 2) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 18, textAlign: "center" }}>
          Add at least 2 players in Settings.
        </Text>
        <Pressable onPress={() => router.push("/setting")} style={{ padding: 14, borderWidth: 1, borderRadius: 12 }}>
          <Text>Go to Settings</Text>
        </Pressable>
      </View>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  const scoreRows = state.players
    .map((p) => ({ id: p.id, name: p.name, score: state.scores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <View style={{ flex: 1, padding: 24, gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ opacity: 0.8 }}>Round {state.round}</Text>
        <Text style={{ opacity: 0.8 }}>
          Turn {state.turnInRound === 0 ? state.players.length : state.turnInRound} / {state.players.length}
        </Text>
      </View>

      <Text style={{ fontSize: 18, opacity: 0.8 }}>Current player</Text>
      <Text style={{ fontSize: 30, fontWeight: "700" }}>{currentPlayer?.name}</Text>

      <View style={{ height: 10 }} />

      <Text style={{ fontSize: 24, textAlign: "center" }}>
        {state.currentTurn?.challengeText ?? "Press Next to start"}
      </Text>

      {state.currentTurn && (
        <Text style={{ textAlign: "center", opacity: 0.8 }}>
          +{state.currentTurn.pointsAwarded} points
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={nextTurn}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderWidth: 1,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>Next</Text>
        </Pressable>

        <Pressable
          onPress={skipTurn}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderWidth: 1,
            borderRadius: 12,
            alignItems: "center",
            opacity: 0.8,
          }}
        >
          <Text style={{ fontSize: 18 }}>Skip</Text>
        </Pressable>
      </View>


      <Pressable onPress={() => router.push("/setting")} style={{ padding: 10, alignSelf: "center" }}>
        <Text>Settings</Text>
      </Pressable>

      <View style={{ height: 8 }} />

      <Text style={{ fontSize: 18, fontWeight: "600" }}>Scoreboard</Text>

      <FlatList
        data={scoreRows}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item, index }) => (
          <View style={{ borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between" }}>
            <Text>{index + 1}. {item.name}</Text>
            <Text>{item.score}</Text>
          </View>
        )}
      />
    </View>
  );
}
