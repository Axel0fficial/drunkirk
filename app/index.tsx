import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Welcome() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "700" }}>Drunkirk</Text>

      <Pressable onPress={() => router.push("/setting")} style={{ padding: 14, borderWidth: 1, borderRadius: 12 }}>
        <Text>Start</Text>
      </Pressable>
    </View>
  );
}
