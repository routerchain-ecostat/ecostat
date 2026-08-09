import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { C } from "../theme/colors";
import { useApp } from "../context/AppContext";

const CELL = 28;

export default function CorrelationMatrix() {
  const { CIDS_C, corrC, corSel, setCorSel, SH } = useApp();

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* 열 헤더 */}
          <View style={{ flexDirection: "row", marginLeft: 46 }}>
            {CIDS_C.map((c) => (
              <View key={c} style={{ width: CELL, height: 40, justifyContent: "flex-end", alignItems: "center" }}>
                <Text style={[styles.headText, { transform: [{ rotate: "-55deg" }] }]}>{SH(c)}</Text>
              </View>
            ))}
          </View>
          {/* 행 */}
          {CIDS_C.map((r) => (
            <View key={r} style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.rowLabel}>{SH(r)}</Text>
              {CIDS_C.map((c) => {
                if (r === c) return <View key={c} style={[styles.cell, { backgroundColor: C.ink }]} />;
                const k = corrC(r, c);
                if (!k)
                  return <View key={c} style={[styles.cell, { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid }]} />;
                const a = Math.min(Math.abs(k[0]), 1) * 0.9;
                const bg = k[0] > 0 ? `rgba(31,79,216,${a})` : `rgba(180,71,42,${a})`;
                const selected = corSel && corSel[0] === r && corSel[1] === c;
                return (
                  <Pressable key={c} onPress={() => setCorSel([r, c])}
                    style={[styles.cell, { backgroundColor: bg }, selected && styles.cellSel]}>
                    <Text style={[styles.cellText, { color: a > 0.5 ? C.paper2 : C.ink }]}>
                      {k[0] > 0 ? "+" : "−"}{Math.abs(k[0]).toFixed(2).slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: C.growth }]} /><Text style={styles.legendText}>같은 방향</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: C.price }]} /><Text style={styles.legendText}>반대 방향</Text></View>
        <Text style={styles.legendText}>진할수록 관계가 강함</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headText: { fontSize: 8, color: C.ink60, width: 40 },
  rowLabel: { width: 46, textAlign: "right", fontSize: 9.5, color: C.ink60, paddingRight: 6 },
  cell: { width: CELL, height: CELL, alignItems: "center", justifyContent: "center" },
  cellSel: { borderWidth: 2, borderColor: C.ink },
  cellText: { fontSize: 8 },
  legend: { flexDirection: "row", gap: 14, marginTop: 10, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendSwatch: { width: 9, height: 9, borderRadius: 1 },
  legendText: { fontSize: 9.5, color: C.ink60 },
});
