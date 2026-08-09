import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { C, monoFont } from "../theme/colors";
import { useApp } from "../context/AppContext";

export default function YearPicker() {
  const { YEARS, year, setYear, ERAS } = useApp();
  const idx = YEARS.indexOf(year);
  const era = ERAS[year];

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.selWrap}>
          <Text style={styles.selLbl}>연도</Text>
          <Picker
            selectedValue={year}
            onValueChange={(v) => setYear(v)}
            style={styles.picker}
            dropdownIconColor={C.ink}
            mode="dropdown"
          >
            {YEARS.map((y) => (
              <Picker.Item key={y} label={`${y}년${y === 2026 ? " (최신)" : ""}`} value={y} />
            ))}
          </Picker>
        </View>
        <Pressable
          style={[styles.nav, idx === 0 && styles.navDisabled]}
          disabled={idx === 0}
          onPress={() => setYear(YEARS[idx - 1])}
        >
          <Text style={styles.navText}>◀</Text>
        </Pressable>
        <Pressable
          style={[styles.nav, idx === YEARS.length - 1 && styles.navDisabled]}
          disabled={idx === YEARS.length - 1}
          onPress={() => setYear(YEARS[idx + 1])}
        >
          <Text style={styles.navText}>▶</Text>
        </Pressable>
        <Text style={styles.era} numberOfLines={2}>{era[0]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  selWrap: {
    backgroundColor: C.paper, borderRadius: 2, overflow: "hidden",
    justifyContent: "center", minWidth: 150,
  },
  selLbl: { position: "absolute", left: 10, top: 4, fontSize: 8, letterSpacing: 1, color: C.ink60, zIndex: 1 },
  picker: {
    color: C.ink, fontFamily: monoFont(), height: Platform.OS === "ios" ? 120 : 48,
    marginTop: Platform.OS === "android" ? 12 : 0,
  },
  nav: { width: 34, height: 38, borderWidth: 1, borderColor: "rgba(237,238,233,0.32)", borderRadius: 2, alignItems: "center", justifyContent: "center" },
  navDisabled: { opacity: 0.3 },
  navText: { color: "rgba(237,238,233,0.7)", fontSize: 11 },
  era: { flex: 1, minWidth: 120, fontSize: 11.5, color: "rgba(237,238,233,0.72)", lineHeight: 16 },
});
