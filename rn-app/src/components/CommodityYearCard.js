import React from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { C, monoFont } from "../theme/colors";
import TrendChart from "./TrendChart";
import Accordion from "./Accordion";
import { useCommodities } from "../context/CommoditiesContext";
import { CAT_COLOR } from "../data/commodities";
import { YEARS } from "../data/data";

const fmt = (v) => {
  if (v == null) return "—";
  return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(v % 1 === 0 ? 1 : 2);
};

export default function CommodityYearCard({ d, year }) {
  const { getYR, yi } = useCommodities();
  const col = CAT_COLOR[d.cat] || "#5C6976";
  const yd = getYR(d);
  const i = yi(year);
  const v = yd.v[i];
  const pv = i > 0 ? yd.v[i - 1] : null;
  const dv = pv == null ? null : v - pv;
  const dcol = dv == null ? C.ink60 : dv > 0 ? "#4A6B3D" : dv < 0 ? "#B4472A" : C.ink60;

  const sorted = [...yd.v].sort((a, b) => b - a);
  const rank = sorted.indexOf(v) + 1;
  const mx = Math.max(...yd.v), mn = Math.min(...yd.v);
  const useBar = d.chart === "bar";

  const points = YEARS.map((y, k) => ({
    label: "'" + String(y).slice(2),
    value: yd.v[k],
    verified: true,
  }));

  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: col }]} />
      <View style={styles.head}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.org, { color: col }]}>{d.org} · {d.cat}</Text>
          <Text style={styles.name}>{d.name}</Text>
          <Text style={styles.sub}>{year}년 · {yd.lab}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.val}>
            {yd.u === "$" ? "$" : ""}
            {fmt(v)}
            {yd.u !== "$" && <Text style={styles.unit}> {yd.u}</Text>}
          </Text>
          <Text style={[styles.delta, { color: dcol }]}>
            {dv == null ? "기준 연도" : `${dv > 0 ? "▲" : dv < 0 ? "▼" : "■"} ${fmt(Math.abs(dv))} 전년 대비`}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        {[["11년 순위", `${rank}위 / ${YEARS.length}`], ["기간 최고", fmt(mx)], ["기간 최저", fmt(mn)]].map(
          ([k, val], idx) => (
            <View key={k} style={[styles.statCell, idx < 2 && styles.statBorder]}>
              <Text style={styles.statK}>{k}</Text>
              <Text style={styles.statV}>{val}</Text>
            </View>
          )
        )}
      </View>

      <View style={{ marginTop: 14 }}>
        <TrendChart points={points} kind={useBar ? "bar" : "line"} color={col} highlightIndex={i} />
      </View>

      <Text style={styles.blockLbl}>{year}년, 이 원자재는</Text>
      <Text style={styles.p}>{yd.n[i]}</Text>

      <View style={[styles.watch, { borderLeftColor: col }]}>
        <Text style={styles.watchLbl}>11년 궤적이 말하는 것</Text>
        <Text style={styles.watchText}>{yd.arc}</Text>
      </View>

      <Accordion title="이 원자재는 무엇이고 왜 중요한가" color={col}>
        <Text style={[styles.blockLbl, { color: col, marginTop: 0 }]}>정의</Text>
        <Text style={styles.p}>{d.what}</Text>
        <Text style={[styles.blockLbl, { color: col }]}>왜 중요한가</Text>
        <Text style={styles.p}>{d.imp}</Text>
      </Accordion>

      <Text style={styles.srcLine}>출처 · {d.src || d.org}</Text>
      <View style={styles.footer}>
        <Text style={styles.footNote}>{yd.lab} 기준</Text>
        <Pressable onPress={() => Linking.openURL(d.url)}>
          <Text style={[styles.link, { color: col }]}>원문 ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

const mono = monoFont();

const styles = StyleSheet.create({
  card: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid, borderRadius: 2, padding: 16, marginBottom: 14, overflow: "hidden" },
  stripe: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  head: { flexDirection: "row", justifyContent: "space-between" },
  org: { fontSize: 9.5, letterSpacing: 1, fontFamily: mono, marginBottom: 4 },
  name: { fontSize: 16.5, fontWeight: "600", color: C.ink, lineHeight: 21 },
  sub: { fontSize: 10.5, color: C.ink60, fontFamily: mono, marginTop: 2 },
  val: { fontSize: 27, fontWeight: "700", color: C.ink, fontFamily: mono, letterSpacing: -0.5 },
  unit: { fontSize: 12, color: C.ink60, fontWeight: "400" },
  delta: { fontSize: 10.5, marginTop: 4, fontFamily: mono, textAlign: "right" },
  stats: { flexDirection: "row", backgroundColor: C.paper, borderWidth: 1, borderColor: C.grid, marginTop: 12 },
  statCell: { flex: 1, padding: 8 },
  statBorder: { borderRightWidth: 1, borderColor: C.grid },
  statK: { fontSize: 8, letterSpacing: 0.6, color: C.ink60, fontFamily: mono },
  statV: { fontSize: 12.5, fontWeight: "500", color: C.ink, fontFamily: mono, marginTop: 2 },
  blockLbl: { fontSize: 9, letterSpacing: 1, color: C.ink60, marginTop: 14, marginBottom: 8 },
  p: { fontSize: 13, lineHeight: 21, color: C.ink },
  watch: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.grid, borderLeftWidth: 3, padding: 12, marginTop: 14 },
  watchLbl: { fontSize: 9, letterSpacing: 1, color: C.ink60, marginBottom: 4 },
  watchText: { fontSize: 12.5, lineHeight: 19, color: C.ink },
  srcLine: { fontSize: 9.5, color: C.ink60, marginTop: 12, fontStyle: "italic" },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  footNote: { fontSize: 9, color: C.ink60, fontFamily: mono },
  link: { fontSize: 11, fontWeight: "600" },
});
