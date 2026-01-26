import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
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


  const [showGameOver, setShowGameOver] = useState(false);

  const gameOver = state.turnInRound === 0 && state.round > state.totalRounds;

  // Open modal when game ends
  useEffect(() => {
    if (gameOver) {
      setShowGameOver(true);
    }
  }, [gameOver]);

  const currentPlayer = state.players[state.currentPlayerIndex];

  const scoreRows = state.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: state.scores[p.id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const topScore = scoreRows[0]?.score ?? 0;
  const winners = scoreRows.filter((r) => r.score === topScore);
  const winnerText =
    winners.length === 1
      ? winners[0].name
      : `Tie: ${winners.map((w) => w.name).join(", ")}`;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {/* GAME OVER MODAL */}
      <Modal visible={showGameOver} transparent animationType="fade">

        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 18,
              borderWidth: 1,
              backgroundColor: "white",
              padding: 18,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "800", textAlign: "center" }}>
              Game Over
            </Text>

            <Text style={{ fontSize: 16, opacity: 0.8, textAlign: "center" }}>
              {state.totalRounds} rounds completed
            </Text>

            <View style={{ height: 8 }} />

            <Text style={{ fontSize: 16, opacity: 0.8, textAlign: "center" }}>
              Winner
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", textAlign: "center" }}>
              {winnerText}
            </Text>

            <Text style={{ fontSize: 16, opacity: 0.8, textAlign: "center" }}>
              Score: {topScore}
            </Text>

            <View style={{ height: 10 }} />

            <Pressable
              onPress={() => {
                setShowGameOver(false);
                router.push("/setting");
              }}
              style={{
                paddingVertical: 14,
                borderWidth: 1,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>Return to Settings</Text>
            </Pressable>

          </View>
        </View>
      </Modal>

      {/* Header: round & turn */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ opacity: 0.8 }}>Round {state.round}</Text>
        <Text style={{ opacity: 0.8 }}>
          Turn{" "}
          {state.turnInRound === 0 ? state.players.length : state.turnInRound} /{" "}
          {state.players.length}
        </Text>
      </View>

      {/* Current player */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, opacity: 0.7 }}>Current player</Text>
        <Text style={{ fontSize: 30, fontWeight: "700" }}>{currentPlayer.name}</Text>
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
          <Text style={{ textAlign: "center", marginTop: 8, opacity: 0.8 }}>
            {state.currentTurn.pointsAwarded > 0
              ? `+${state.currentTurn.pointsAwarded} points`
              : "0 points"}
          </Text>
        )}

        {state.currentTurn?.categories?.length ? (
          <Text style={{ textAlign: "center", marginTop: 8, opacity: 0.7 }}>
            {state.currentTurn.categories.join(" • ")}
          </Text>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <Pressable
          onPress={nextTurn}
          disabled={gameOver}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderWidth: 1,
            borderRadius: 12,
            alignItems: "center",
            opacity: gameOver ? 0.4 : 1,
          }}
        >
          <Text style={{ fontSize: 18 }}>Next</Text>
        </Pressable>

        <Pressable
          onPress={skipTurn}
          disabled={gameOver}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderWidth: 1,
            borderRadius: 12,
            alignItems: "center",
            opacity: gameOver ? 0.4 : 0.8,
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
            const target = state.players.find((p) => p.id === t.targetPlayerId);
            return (
              <Text key={t.id} style={{ marginTop: 4 }}>
                • {target?.name ?? "Unknown"}: {t.action} ({t.remainingRounds} rounds left)
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
      <Pressable onPress={() => router.push("/setting")} style={{ padding: 12, alignItems: "center" }}>
        <Text>Settings</Text>
      </Pressable>
    </View>
  );
}
