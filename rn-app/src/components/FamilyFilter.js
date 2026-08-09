import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { C } from "../theme/colors";
import { useApp } from "../context/AppContext";

export default function FamilyFilter() {
  const { FAMS, BASE, famFilter, setFamFilter } = useApp();
  const items = ["전체", ...FAMS];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 4 }}>
      {items.map((f) => {
        const on = famFilter === f;
        const count = f === "전체" ? BASE.length : BASE.filter((d) => d.fam === f).length;
        return (
          <Pressable key={f} onPress={() => setFamFilter(f)} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.text, on && styles.textOn]}>
              {f}{f !== "전체" ? ` ${count}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: C.grid, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 12 },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  text: { fontSize: 10.5, color: C.ink60 },
  textOn: { color: C.paper, fontWeight: "600" },
});
