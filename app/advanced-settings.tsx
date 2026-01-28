import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { CHALLENGES } from "../src/domain/game/challenges";
import { useGame } from "../src/state/gameStore";
import { BasePalette } from "../src/ui/theme/colors";

type SectionItem = {
  id: string;
  title: string;
};

type Section = {
  title: string; // category
  data: SectionItem[];
};

function challengeTitle(ch: any) {
  // Simple: show text/action depending on kind
  if (ch.kind === "tracked") {
    return `Tracked: ${ch.action}`;
  }
  return ch.text;
}

export default function AdvancedSettings() {
  const { state, toggleCategory, toggleFavorite, toggleChallengeEnabled } =
    useGame();

  const isDisabled = (challengeId: string) => {
    return state.advanced.disabledChallenges?.[challengeId] === true;
  };

  const sections: Section[] = useMemo(() => {
    // Map category -> challenges
    const map = new Map<string, SectionItem[]>();

    for (const ch of CHALLENGES as any[]) {
      const cats: string[] = ch.categories ?? ["uncategorized"];
      for (const cat of cats) {
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push({
          id: ch.id,
          title: challengeTitle(ch),
        });
      }
    }

    // Sort categories, sort challenges within category
    const sortedCats = Array.from(map.keys()).sort((a, b) =>
      a.localeCompare(b),
    );
    return sortedCats.map((cat) => ({
      title: cat,
      data: (map.get(cat) ?? []).sort((a, b) => a.title.localeCompare(b.title)),
    }));
  }, []);

  const isCategoryEnabled = (category: string) => {
    const v = state.advanced.enabledCategories[category];
    return v !== false; // default enabled
  };

  const isFavorite = (challengeId: string) => {
    return !!state.advanced.favoriteChallenges[challengeId];
  };

  return (
    <View
      style={{ backgroundColor: BasePalette.background, flex: 1, padding: 24 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: BasePalette.background,
          borderColor: BasePalette.primary,
        }}
      >
        <Text
          style={{ fontSize: 26, fontWeight: "700", color: BasePalette.text }}
        >
          Advanced settings
        </Text>

        <Pressable onPress={() => router.back()} style={{ padding: 10 }}>
          <Text style={{ color: BasePalette.text }}>Back</Text>
        </Pressable>
      </View>

      <Text style={{ color: BasePalette.text, marginTop: 8, opacity: 0.8 }}>
        Disable categories and mark favorite challenges.
      </Text>

      <View style={{ height: 16 }} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderSectionHeader={({ section }) => {
          const enabled = isCategoryEnabled(section.title);

          return (
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
              <View>
                <Text
                  style={{
                    color: BasePalette.text,
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                >
                  {section.title}
                </Text>
                <Text style={{ color: BasePalette.text, opacity: 0.7 }}>
                  {enabled ? "Enabled" : "Disabled"} • {section.data.length}{" "}
                  challenges
                </Text>
              </View>

              <Pressable
                onPress={() => toggleCategory(section.title)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderWidth: 1,
                  borderRadius: 10,
                  opacity: enabled ? 1 : 0.7,
                  borderColor: BasePalette.primary,
                }}
              >
                <Text style={{ color: BasePalette.text }}>
                  {enabled ? "Disable" : "Enable"}
                </Text>
              </Pressable>
            </View>
          );
        }}
        renderItem={({ item, section }) => {
          const enabled = isCategoryEnabled(section.title);
          const disabled = isDisabled(item.id);
          const fav = isFavorite(item.id);

          return (
            <View
              style={{
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                opacity: enabled ? 1 : 0.45,
                borderColor: BasePalette.primary,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                  borderColor: BasePalette.primary,
                }}
              >
                <Text
                  style={{
                    color: BasePalette.text,
                    flex: 1,
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {item.title}
                </Text>

                <View style={{ gap: 8, alignItems: "flex-end" }}>
                  <Pressable
                    onPress={() => toggleFavorite(item.id)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderRadius: 10,
                      opacity: disabled ? 0.5 : 1,
                      borderColor: BasePalette.primary,
                    }}
                  >
                    <Text style={{ color: BasePalette.text }}>
                      {fav ? "★ Favorite" : "☆ Favorite"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => toggleChallengeEnabled(item.id)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderRadius: 10,
                      borderColor: BasePalette.primary,
                    }}
                  >
                    <Text style={{ color: BasePalette.text }}>
                      {disabled ? "Off" : "On"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
