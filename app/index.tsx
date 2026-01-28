import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BasePalette } from "../src/ui/theme/colors";

export default function Welcome() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: BasePalette.background,
        alignItems: "center",
        gap: 16,
      }}
    >
      <Text
        style={{ fontSize: 32, color: BasePalette.text, fontWeight: "700" }}
      >
        Drunkirk
      </Text>

      <Pressable
        onPress={() => router.push("/setting")}
        style={{
          padding: 14,
          borderWidth: 1,
          borderColor: BasePalette.primary,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: BasePalette.text }}>Start</Text>
      </Pressable>
    </View>
  );
}
