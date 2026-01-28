import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { useGame } from "../src/state/gameStore";
import { BasePalette } from "../src/ui/theme/colors";

type Difficulty = "easy" | "normal" | "hard" | "brutal";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard", "brutal"];

export default function Custom() {
  const {
    state,
    addCustomChallenge,
    editCustomChallenge,
    deleteCustomChallenge,
    toggleFavorite,
    toggleChallengeEnabled,
  } = useGame();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  const customList = state.customChallenges ?? [];

  const isFavorite = (id: string) =>
    state.advanced.favoriteChallenges?.[id] === true;
  const isDisabled = (id: string) =>
    state.advanced.disabledChallenges?.[id] === true;

  const openAdd = () => {
    setEditingId(null);
    setText("");
    setDifficulty("normal");
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const item = customList.find((c) => c.id === id);
    if (!item) return;
    setEditingId(id);
    setText(item.text);
    setDifficulty(item.difficulty);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const onSave = () => {
    const cleaned = text.trim();
    if (!cleaned) return;

    if (editingId) {
      editCustomChallenge(editingId, cleaned, difficulty);
    } else {
      addCustomChallenge(cleaned, difficulty);
    }
    closeModal();
  };

  const headerText = useMemo(() => {
    if (customList.length === 0) return "No custom challenges yet.";
    return `${customList.length} custom challenge${customList.length === 1 ? "" : "s"}`;
  }, [customList.length]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BasePalette.background,
        padding: 24,
        gap: 14,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{ fontSize: 26, fontWeight: "800", color: BasePalette.text }}
        >
          Custom
        </Text>

        <Pressable onPress={() => router.back()} style={{ padding: 10 }}>
          <Text style={{ color: BasePalette.text }}>Back</Text>
        </Pressable>
      </View>

      <Text style={{ color: BasePalette.mutedText }}>{headerText}</Text>

      {/* Add button */}
      <Pressable
        onPress={openAdd}
        style={{
          borderWidth: 2,
          borderColor: BasePalette.primary,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: BasePalette.text, fontWeight: "800" }}>
          + Add custom challenge
        </Text>
      </Pressable>

      {/* List */}
      <FlatList
        data={customList}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: 24 }}
        renderItem={({ item }) => {
          const fav = isFavorite(item.id);
          const disabled = isDisabled(item.id);

          return (
            <View
              style={{
                borderWidth: 2,
                borderColor: BasePalette.primary,
                borderRadius: 14,
                padding: 12,
                backgroundColor: "rgba(255,255,255,0.04)",
                opacity: disabled ? 0.55 : 1,
                gap: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: BasePalette.text, fontWeight: "800" }}>
                    {item.text}
                  </Text>
                  <Text style={{ color: BasePalette.mutedText }}>
                    Difficulty: {item.difficulty.toUpperCase()}
                  </Text>
                </View>

                <View style={{ gap: 8, alignItems: "flex-end" }}>
                  <Pressable
                    onPress={() => toggleFavorite(item.id)}
                    style={{
                      borderWidth: 2,
                      borderColor: BasePalette.primary,
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{ color: BasePalette.text, fontWeight: "800" }}
                    >
                      {fav ? "★ Fav" : "☆ Fav"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => toggleChallengeEnabled(item.id)}
                    style={{
                      borderWidth: 2,
                      borderColor: BasePalette.primary,
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{ color: BasePalette.text, fontWeight: "800" }}
                    >
                      {disabled ? "Off" : "On"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => openEdit(item.id)}
                  style={{
                    flex: 1,
                    borderWidth: 2,
                    borderColor: BasePalette.primary,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: BasePalette.text, fontWeight: "800" }}>
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => deleteCustomChallenge(item.id)}
                  style={{
                    flex: 1,
                    borderWidth: 2,
                    borderColor: BasePalette.primary,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                    opacity: 0.9,
                  }}
                >
                  <Text style={{ color: BasePalette.text, fontWeight: "800" }}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 520,
              borderWidth: 2,
              borderColor: BasePalette.primary,
              borderRadius: 18,
              backgroundColor: BasePalette.background,
              padding: 16,
              gap: 12,
            }}
          >
            <Text
              style={{
                color: BasePalette.text,
                fontSize: 22,
                fontWeight: "900",
              }}
            >
              {editingId ? "Edit challenge" : "Add challenge"}
            </Text>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder='e.g. "Cheers! everyone drinks"'
              placeholderTextColor={BasePalette.mutedText}
              multiline
              style={{
                borderWidth: 2,
                borderColor: BasePalette.primary,
                borderRadius: 14,
                padding: 12,
                color: BasePalette.text,
                minHeight: 90,
                textAlignVertical: "top",
              }}
            />

            <Text style={{ color: BasePalette.mutedText, marginTop: 4 }}>
              Difficulty
            </Text>

            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {DIFFICULTIES.map((d) => {
                const selected = difficulty === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDifficulty(d)}
                    style={{
                      borderWidth: 2,
                      borderColor: BasePalette.primary,
                      borderRadius: 999,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      backgroundColor: selected
                        ? BasePalette.primary
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#000" : BasePalette.text,
                        fontWeight: "900",
                      }}
                    >
                      {d.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable
                onPress={closeModal}
                style={{
                  flex: 1,
                  borderWidth: 2,
                  borderColor: BasePalette.primary,
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: "center",
                  opacity: 0.85,
                }}
              >
                <Text style={{ color: BasePalette.text, fontWeight: "900" }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={onSave}
                style={{
                  flex: 1,
                  borderWidth: 2,
                  borderColor: BasePalette.primary,
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: "center",
                  backgroundColor: BasePalette.primary,
                }}
              >
                <Text style={{ color: "#000", fontWeight: "900" }}>
                  {editingId ? "Save" : "Add"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
