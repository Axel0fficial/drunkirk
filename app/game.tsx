import { router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useGame } from "../src/state/gameStore";

export default function Game() {
  const { state, nextTurn, skipTurn } = useGame();

  // Guard: game not ready
  if (state.players.length < 2) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 18, textAlign: "center" }}>
          Add at least 2 players in Settings to start the game.
        </Text>

        <Pressable
          onPress={() => router.push("/setting")}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderWidth: 1,
            borderRadius: 12,
          }}
        >
          <Text>Go to Settings</Text>
        </Pressable>
      </View>
    );
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  const scoreRows = state.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: state.scores[p.id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {/* Header: round & turn */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ opacity: 0.8 }}>Round {state.round}</Text>
        <Text style={{ opacity: 0.8 }}>
          Turn{" "}
          {state.turnInRound === 0
            ? state.players.length
            : state.turnInRound}{" "}
          / {state.players.length}
        </Text>
      </View>

      {/* Current player */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, opacity: 0.7 }}>Current player</Text>
        <Text style={{ fontSize: 30, fontWeight: "700" }}>
          {currentPlayer.name}
        </Text>
      </View>

      {/* Current challenge */}
      <View
        style={{
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 24, textAlign: "center" }}>
          {state.currentTurn?.challengeText ?? "Press Next to start"}
        </Text>

        {state.currentTurn && (
          <Text
            style={{
              textAlign: "center",
              marginTop: 8,
              opacity: 0.8,
            }}
          >
            {state.currentTurn.pointsAwarded > 0
              ? `+${state.currentTurn.pointsAwarded} points`
              : "0 points"}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
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

      {/* Active tracked challenges */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          Active tracked challenges
        </Text>

        {state.activeTracked.length === 0 ? (
          <Text style={{ opacity: 0.7, marginTop: 6 }}>None</Text>
        ) : (
          state.activeTracked.map((t) => {
            const target = state.players.find(
              (p) => p.id === t.targetPlayerId
            );
            return (
              <Text key={t.id} style={{ marginTop: 4 }}>
                • {target?.name ?? "Unknown"}: {t.action} (
                {t.remainingRounds} rounds left)
              </Text>
            );
          })
        )}
      </View>

      {/* Scoreboard */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
          Scoreboard
        </Text>

        <FlatList
          data={scoreRows}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item, index }) => (
            <View
              style={{
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text>
                {index + 1}. {item.name}
              </Text>
              <Text>{item.score}</Text>
            </View>
          )}
        />
      </View>

      {/* Footer */}
      <Pressable
        onPress={() => router.push("/setting")}
        style={{ padding: 12, alignItems: "center" }}
      >
        <Text>Settings</Text>
      </Pressable>
    </View>
  );
}
