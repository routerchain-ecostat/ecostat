import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { C, FAM } from "../theme/colors";
import { useApp } from "../context/AppContext";

export default function TemperatureStrip({ onJump }) {
  const { BASE, D, year, yi, getYR, SH } = useApp();
  const yMode = year !== 2026;
  const i = yi(year);

  const bars = BASE.map((d) => {
    let dv, rel, improving;
    if (yMode) {
      const yd = getYR(d);
      const v = yd.v[i];
      const pv = i > 0 ? yd.v[i - 1] : v;
      dv = v - pv;
      rel = Math.min(Math.abs(dv / (Math.abs(pv) || 1)) * 4, 1);
      improving = d.good === "flat" || dv === 0 ? null : d.good === "up" ? dv > 0 : dv < 0;
    } else {
      const dd = D.find((x) => x.id === d.id) || d;
      dv = dd.prev != null ? dd.val - dd.prev : null;
      rel = dd.prev ? Math.min(Math.abs(dv / (Math.abs(dd.prev) || 1)) * 6, 1) : 0.2;
      improving = dv == null || d.good === "flat" ? null : d.good === "up" ? dv > 0 : dv < 0;
    }
    const color = improving == null ? C.ink60 : improving ? FAM[d.fam] || C.ink60 : C.price;
    return { id: d.id, name: d.name, color, height: 10 + rel * 24 };
  });

  return (
    <View>
      <View style={styles.row}>
        {bars.map((b) => (
          <Pressable key={b.id} onPress={() => onJump && onJump(b.id)} style={{ flex: 1 }}>
            <View style={[styles.bar, { height: b.height, backgroundColor: b.color }]} />
          </Pressable>
        ))}
      </View>
      <View style={styles.labelRow}>
        {BASE.map((d) => (
          <Text key={d.id} style={styles.label} numberOfLines={1}>{SH(d.id)}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", height: 34, gap: 2, marginBottom: 3 },
  bar: { borderRadius: 1, opacity: 0.85 },
  labelRow: { flexDirection: "row", gap: 2, marginBottom: 10 },
  label: { flex: 1, fontSize: 6.5, color: "rgba(237,238,233,0.55)", textAlign: "center" },
});
