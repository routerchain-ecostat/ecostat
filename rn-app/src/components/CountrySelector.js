import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { C } from "../theme/colors";
import { COUNTRY_LIST } from "../data/data";
import { useApp } from "../context/AppContext";

export default function CountrySelector() {
  const { country, setCountry } = useApp();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={{ gap: 6 }}>
      {COUNTRY_LIST.map((c) => {
        const on = c.id === country;
        return (
          <Pressable key={c.id} onPress={() => setCountry(c.id)} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.text, on && styles.textOn]}>{c.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: "rgba(237,238,233,0.32)", borderRadius: 2, paddingVertical: 6, paddingHorizontal: 15 },
  chipOn: { backgroundColor: C.paper, borderColor: C.paper },
  text: { fontSize: 12.5, color: "rgba(237,238,233,0.7)" },
  textOn: { color: C.ink, fontWeight: "600" },
});
