// app/game.tsx
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useGame } from "../src/state/gameStore";
import { BasePalette, DifficultyPalettes } from "../src/ui/theme/colors";

export default function Game() {
  const { state, nextTurn, skipTurn } = useGame();

  // Guard: game not ready
  if (state.players.length < 2) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BasePalette.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          gap: 16,
        }}
      >
        <Text
          style={{ fontSize: 18, textAlign: "center", color: BasePalette.text }}
        >
          Add at least 2 players in Settings to start the game.
        </Text>

        <Pressable
          onPress={() => router.push("/setting")}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderWidth: 2,
            borderRadius: 12,
            borderColor: BasePalette.primary,
          }}
        >
          <Text style={{ color: BasePalette.text }}>Go to Settings</Text>
        </Pressable>
      </View>
    );
  }

  const gameOver = state.turnInRound === 0 && state.round > state.totalRounds;

  // Modal is local state so it can close before navigating
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) setShowGameOver(true);
  }, [gameOver]);

  const currentPlayer = state.players[state.currentPlayerIndex];

  const difficulty = state.currentTurn?.difficulty ?? "brutal";
  const palette = DifficultyPalettes[difficulty];

  const scoreRows = useMemo(() => {
    return state.players
      .map((p) => ({
        id: p.id,
        name: p.name,
        score: state.scores[p.id] ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
  }, [state.players, state.scores]);

  const topScore = scoreRows[0]?.score ?? 0;
  const winners = scoreRows.filter((r) => r.score === topScore);
  const winnerText =
    winners.length === 1
      ? winners[0].name
      : `Tie: ${winners.map((w) => w.name).join(", ")}`;

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: palette.background }}>
      {/* GAME OVER MODAL (Base palette) */}
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
              borderWidth: 2,
              borderColor: BasePalette.primary,
              backgroundColor: BasePalette.background,
              padding: 18,
              gap: 12,
            }}
          >
            <Text
              style={{
                fontSize: 26,
                fontWeight: "800",
                textAlign: "center",
                color: BasePalette.text,
              }}
            >
              Game Over
            </Text>

            <Text
              style={{
                fontSize: 16,
                opacity: 0.85,
                textAlign: "center",
                color: BasePalette.mutedText,
              }}
            >
              {state.totalRounds} rounds completed
            </Text>

            <View style={{ height: 8 }} />

            <Text
              style={{
                fontSize: 16,
                opacity: 0.85,
                textAlign: "center",
                color: BasePalette.mutedText,
              }}
            >
              Winner
            </Text>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                textAlign: "center",
                color: BasePalette.primary,
              }}
            >
              {winnerText}
            </Text>

            <Text
              style={{
                fontSize: 16,
                opacity: 0.85,
                textAlign: "center",
                color: BasePalette.mutedText,
              }}
            >
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
                borderWidth: 2,
                borderRadius: 12,
                alignItems: "center",
                borderColor: BasePalette.primary,
              }}
            >
              <Text style={{ fontSize: 18, color: BasePalette.text }}>
                Return to Settings
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Header: round & turn */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ opacity: 0.85, color: palette.text }}>
          Round {state.round}
        </Text>
        <Text style={{ opacity: 0.85, color: palette.text }}>
          Turn{" "}
          {state.turnInRound === 0 ? state.players.length : state.turnInRound} /{" "}
          {state.players.length}
        </Text>
      </View>

      {/* Current player */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, opacity: 0.8, color: palette.text }}>
          Current player
        </Text>
        <Text style={{ fontSize: 30, fontWeight: "800", color: palette.text }}>
          {currentPlayer.name}
        </Text>
      </View>

      {/* Current challenge */}
      <View
        style={{
          borderWidth: 2,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderColor: palette.primary,
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      >
        <Text
          style={{ fontSize: 24, textAlign: "center", color: palette.text }}
        >
          {state.currentTurn?.challengeText ?? "Press Next to start"}
        </Text>

        <Text
          style={{
            textAlign: "center",
            marginTop: 10,
            color: palette.accent,
            fontWeight: "800",
            letterSpacing: 1,
          }}
        >
          {difficulty.toUpperCase()}
        </Text>

        {state.currentTurn && (
          <Text
            style={{
              textAlign: "center",
              marginTop: 8,
              opacity: 0.85,
              color: palette.text,
            }}
          >
            {state.currentTurn.pointsAwarded > 0
              ? `+${state.currentTurn.pointsAwarded} points`
              : "0 points"}
          </Text>
        )}

        {state.currentTurn?.categories?.length ? (
          <Text
            style={{
              textAlign: "center",
              marginTop: 8,
              opacity: 0.7,
              color: palette.text,
            }}
          >
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
            borderRadius: 12,
            borderWidth: 2,
            borderColor: palette.primary,
            backgroundColor: palette.primary,
            alignItems: "center",
            opacity: gameOver ? 0.4 : 1,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#000" }}>
            Next
          </Text>
        </Pressable>

        <Pressable
          onPress={skipTurn}
          disabled={gameOver}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: palette.accent,
            backgroundColor: "transparent",
            alignItems: "center",
            opacity: gameOver ? 0.4 : 1,
          }}
        >
          <Text
            style={{ fontSize: 18, fontWeight: "800", color: palette.text }}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Active tracked challenges */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: palette.text }}>
          Active tracked challenges
        </Text>

        {state.activeTracked.length === 0 ? (
          <Text style={{ opacity: 0.7, marginTop: 6, color: palette.text }}>
            None
          </Text>
        ) : (
          state.activeTracked.map((t) => {
            const target = state.players.find((p) => p.id === t.targetPlayerId);
            return (
              <Text
                key={t.id}
                style={{ marginTop: 4, color: palette.text, opacity: 0.9 }}
              >
                • {target?.name ?? "Unknown"}: {t.action} ({t.remainingRounds}{" "}
                rounds left)
              </Text>
            );
          })
        )}
      </View>

      {/* Scoreboard */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            marginBottom: 8,
            color: palette.text,
          }}
        >
          Scoreboard
        </Text>

        <FlatList
          data={scoreRows}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item, index }) => (
            <View
              style={{
                borderWidth: 2,
                borderRadius: 12,
                padding: 12,
                borderColor: palette.primary,
                backgroundColor: "rgba(255,255,255,0.04)",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: palette.text, fontWeight: "700" }}>
                {index + 1}. {item.name}
              </Text>
              <Text style={{ color: palette.text, fontWeight: "700" }}>
                {item.score}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Footer */}
      <Pressable
        onPress={() => router.push("/setting")}
        style={{ padding: 12, alignItems: "center" }}
      >
        <Text style={{ color: palette.text, opacity: 0.9 }}>Settings</Text>
      </Pressable>
    </View>
  );
}
