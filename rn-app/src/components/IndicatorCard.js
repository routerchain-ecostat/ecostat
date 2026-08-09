import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { C, FAM, monoFont } from "../theme/colors";
import TrendChart, { MiniChart } from "./TrendChart";
import Accordion from "./Accordion";
import EditModal from "./EditModal";
import { useApp } from "../context/AppContext";

const fmt = (v, unit) => {
  if (v == null) return "—";
  if (["천명", "천건", "천호", "$"].includes(unit)) return Math.round(v).toLocaleString();
  return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(v % 1 === 0 ? 1 : 2);
};

export default function IndicatorCard({ d, onLayout }) {
  const { editValue } = useApp();
  const [editOpen, setEditOpen] = useState(false);

  const col = FAM[d.fam] || C.ink60;
  const dv = d.prev != null ? d.val - d.prev : null;
  const improving =
    dv == null ? null : d.good === "flat" ? null : d.good === "up" ? dv > 0 : dv < 0;
  const dcol = improving == null ? C.ink60 : improving ? col : C.price;
  const verifiedCount = d.series.filter((s) => s.ver).length;
  const isLive = !!(d.edited && typeof d.sub === "string" && d.sub.startsWith("실시간"));

  const points = d.series.map((s) => ({ label: s.m, value: s.v, verified: s.ver }));
  const showRef = d.ref != null || d.id === "cpi" || d.id === "pce" || d.id === "ism_mfg" || d.id === "ism_svc";
  const refVal = d.ref != null ? d.ref : d.id === "ism_mfg" || d.id === "ism_svc" ? 50 : 2;

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={[styles.stripe, { backgroundColor: col }]} />
      <View style={styles.head}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.org, { color: col }]}>{d.org} · {d.fam}</Text>
          <Text style={styles.name}>{d.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.sub}>{d.sub}</Text>
            {isLive && (
              <View style={styles.liveDot}>
                <Text style={styles.liveDotText}>LIVE</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.val}>
            {d.unit === "$" ? "$" : ""}
            {fmt(d.val, d.unit)}
            {d.unit !== "$" && <Text style={styles.unit}> {d.unit}</Text>}
          </Text>
          {dv != null && (
            <Text style={[styles.delta, { color: dcol }]}>
              {dv > 0 ? "▲" : dv < 0 ? "▼" : "■"} {fmt(Math.abs(dv), d.unit)} 직전 대비
            </Text>
          )}
        </View>
      </View>

      {/* 발표 일정 */}
      <View style={styles.sched}>
        {[["주기", d.sched.cyc], ["시각", d.sched.time], ["발표", d.sched.when], ["다음", d.sched.next]].map(
          ([k, v], i) => (
            <View key={k} style={[styles.schedCell, i % 2 === 0 && styles.schedCellBorder]}>
              <Text style={styles.schedK}>{k}</Text>
              <Text style={[styles.schedV, k === "다음" && { color: col, fontWeight: "600" }]}>{v}</Text>
            </View>
          )
        )}
      </View>

      <View style={{ marginTop: 14 }}>
        <TrendChart
          points={points}
          kind={d.chart === "step" ? "step" : d.chart}
          color={col}
          refLine={showRef ? refVal : null}
        />
      </View>

      {d.s2 && (
        <MiniChart
          points={d.s2.map((s) => ({ label: s.m, value: s.v }))}
          label={d.s2lab}
        />
      )}

      {/* 보조 수치 */}
      <View style={styles.extras}>
        {d.extra.map(([k, v], i) => (
          <View key={k} style={[styles.extraCell, i % 2 === 0 && styles.extraBorder]}>
            <Text style={styles.extraK}>{k}</Text>
            <Text style={styles.extraV}>{v}</Text>
          </View>
        ))}
      </View>

      <Accordion title="이 지표는 무엇이고 왜 중요한가" color={col}>
        <Text style={[styles.lbl, { color: col }]}>정의</Text>
        <Text style={styles.p}>{d.what}</Text>
        <Text style={[styles.lbl, { color: col, marginTop: 12 }]}>왜 중요한가</Text>
        <Text style={styles.p}>{d.imp}</Text>
      </Accordion>

      <Accordion title="왜 이런 수치가 나왔나" defaultOpen color={col}>
        {d.why.map((p, i) => (
          <View key={i} style={styles.whyRow}>
            <Text style={[styles.whyNum, { color: col }]}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={styles.whyText}>{p}</Text>
          </View>
        ))}
        <View style={[styles.watch, { borderLeftColor: col }]}>
          <Text style={styles.watchLbl}>확인 포인트</Text>
          <Text style={styles.watchText}>{d.watch}</Text>
        </View>
      </Accordion>

      <Text style={styles.srcLine}>출처 · {d.src || d.org}</Text>

      {/* 하단 액션 */}
      <View style={styles.footer}>
        <Text style={styles.footNote}>공표 확인 {verifiedCount}/{d.series.length}</Text>
        <Pressable style={styles.pillBtn} onPress={() => setEditOpen(true)}>
          <Text style={styles.pillText}>수치 수정</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(d.url)}>
          <Text style={[styles.link, { color: col }]}>원문 ↗</Text>
        </Pressable>
      </View>

      <EditModal
        visible={editOpen}
        indicator={d}
        onClose={() => setEditOpen(false)}
        onSave={editValue}
      />
    </View>
  );
}

const mono = monoFont();

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid,
    borderRadius: 2, padding: 16, marginBottom: 14, overflow: "hidden",
  },
  stripe: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  head: { flexDirection: "row", justifyContent: "space-between" },
  org: { fontSize: 9.5, letterSpacing: 1, fontFamily: mono, marginBottom: 4 },
  name: { fontSize: 16.5, fontWeight: "600", color: C.ink, lineHeight: 21 },
  sub: { fontSize: 10.5, color: C.ink60, fontFamily: mono, marginTop: 2 },
  liveDot: { backgroundColor: "#4A6B3D", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1.5, marginTop: 2 },
  liveDotText: { color: "#fff", fontSize: 7.5, fontWeight: "700", fontFamily: mono, letterSpacing: 0.5 },
  val: { fontSize: 27, fontWeight: "700", color: C.ink, fontFamily: mono, letterSpacing: -0.5 },
  unit: { fontSize: 12, color: C.ink60, fontWeight: "400" },
  delta: { fontSize: 10.5, marginTop: 4, fontFamily: mono, textAlign: "right" },

  sched: { flexDirection: "row", flexWrap: "wrap", backgroundColor: C.paper, borderWidth: 1, borderColor: C.grid, marginTop: 12 },
  schedCell: { width: "50%", padding: 8, borderBottomWidth: 1, borderColor: C.grid },
  schedCellBorder: { borderRightWidth: 1 },
  schedK: { fontSize: 8, letterSpacing: 0.6, color: C.ink60, fontFamily: mono },
  schedV: { fontSize: 11.5, color: C.ink, marginTop: 2, lineHeight: 15 },

  extras: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.grid, marginTop: 12, marginBottom: 4 },
  extraCell: { width: "50%", paddingVertical: 8, paddingRight: 8 },
  extraBorder: { paddingRight: 10 },
  extraK: { fontSize: 10, color: C.ink60, marginBottom: 2 },
  extraV: { fontSize: 13, fontWeight: "500", color: C.ink, fontFamily: mono },

  lbl: { fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  p: { fontSize: 12.5, lineHeight: 20, color: C.ink },

  whyRow: { flexDirection: "row", marginBottom: 9, gap: 9 },
  whyNum: { fontSize: 9, fontFamily: mono, paddingTop: 4, width: 16 },
  whyText: { flex: 1, fontSize: 13, lineHeight: 21, color: C.ink },

  watch: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.grid, borderLeftWidth: 3, padding: 12, marginTop: 6 },
  watchLbl: { fontSize: 9, letterSpacing: 1, color: C.ink60, marginBottom: 4 },
  watchText: { fontSize: 12.5, lineHeight: 19, color: C.ink },

  srcLine: { fontSize: 9.5, color: C.ink60, marginTop: 12, fontStyle: "italic" },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" },
  footNote: { fontSize: 9, color: C.ink60, fontFamily: mono },
  pillBtn: { borderWidth: 1, borderColor: C.grid, borderRadius: 10, paddingVertical: 3, paddingHorizontal: 9 },
  pillText: { fontSize: 8.5, color: C.ink60 },
  link: { fontSize: 11, fontWeight: "600" },
});
