import React from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { C, monoFont } from "../theme/colors";
import { useCommodities } from "../context/CommoditiesContext";
import CategoryFilter from "../components/CategoryFilter";
import CommodityCard from "../components/CommodityCard";
import CommodityYearCard from "../components/CommodityYearCard";

const INTRO =
  "에너지·귀금속·산업금속·농산물·축산물 26개 원자재를 한곳에서 봅니다. 원자재는 물가의 " +
  "'재료'입니다 — 유가가 오르면 몇 달 뒤 CPI 에너지 항목이 오르고, 구리가 오르면 " +
  "건설·전력 원가가 오릅니다. 지표 탭의 여러 CPI 카드가 '이란 사태발 유가 상승'을 " +
  "공통으로 언급하는 이유가 여기 있습니다.";

export default function CommoditiesScreen() {
  const { ready, YEARS, year, setYear, BASE, D, catFilter, refreshing, lastRefresh, refreshAll } = useCommodities();
  const yMode = year !== 2026;

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.ink} />
      </View>
    );
  }

  const list = (yMode ? BASE : D).filter((d) => catFilter === "전체" || d.cat === catFilter);
  const idx = YEARS.indexOf(year);
  const statusText = refreshing ? "자동 갱신 중…" : lastRefresh ? `자동 갱신 · ${relTime(lastRefresh)}` : "자동 갱신 대기 중";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={styles.header}>
        <Text style={styles.hsub}>EIA · CME Group · ICE · LBMA · COMEX · LME · USDA</Text>
        <Text style={styles.htitle}>원자재 관제탑</Text>
        <Text style={styles.hcount}>{BASE.length}개 원자재 · 에너지·귀금속·산업금속·농산물·축산물</Text>

        <View style={styles.yrow}>
          <View style={styles.selWrap}>
            <Text style={styles.selLbl}>연도</Text>
            <Picker selectedValue={year} onValueChange={setYear} style={styles.picker} dropdownIconColor={C.ink} mode="dropdown">
              {YEARS.map((y) => (
                <Picker.Item key={y} label={`${y}년${y === 2026 ? " (최신)" : ""}`} value={y} />
              ))}
            </Picker>
          </View>
          <Pressable style={[styles.nav, idx === 0 && styles.navDisabled]} disabled={idx === 0} onPress={() => setYear(YEARS[idx - 1])}>
            <Text style={styles.navText}>◀</Text>
          </Pressable>
          <Pressable style={[styles.nav, idx === YEARS.length - 1 && styles.navDisabled]} disabled={idx === YEARS.length - 1} onPress={() => setYear(YEARS[idx + 1])}>
            <Text style={styles.navText}>▶</Text>
          </Pressable>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{statusText}</Text>
          <Text style={styles.statusHint}>아래로 당기면 즉시 갱신</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={C.ink} />}
      >
        <Text style={styles.intro}>{INTRO}</Text>

        <View style={{ marginBottom: 4 }}>
          <CategoryFilter />
        </View>

        {list.map((d) =>
          yMode ? <CommodityYearCard key={d.id} d={d} year={year} /> : <CommodityCard key={d.id} d={d} />
        )}

        <Text style={styles.foot}>
          {yMode
            ? `${year}년 값은 원자재별 연말 종가 기준입니다. 2016~2024년은 확정치, 2025~2026년은 근사치입니다.`
            : "기준 2026-07-29 · 에너지·귀금속은 실시간에 가까운 시세, 농산물은 계절적으로 변동이 큽니다 · 채워진 점 = 확인치, 빈 점 = 추세 보간치"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const mono = monoFont();

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.paper },
  header: { backgroundColor: C.ink, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 12 },
  hsub: { color: C.ink60, fontSize: 10, marginBottom: 4 },
  htitle: { color: C.paper, fontSize: 22, fontWeight: "700" },
  hcount: { color: "rgba(237,238,233,0.6)", fontSize: 11, marginTop: 3, marginBottom: 12 },
  yrow: { flexDirection: "row", alignItems: "center", gap: 8 },
  selWrap: { backgroundColor: C.paper, borderRadius: 2, overflow: "hidden", justifyContent: "center", minWidth: 150 },
  selLbl: { position: "absolute", left: 10, top: 4, fontSize: 8, letterSpacing: 1, color: C.ink60, zIndex: 1 },
  picker: { color: C.ink, fontFamily: mono, height: 48 },
  nav: { width: 34, height: 38, borderWidth: 1, borderColor: "rgba(237,238,233,0.32)", borderRadius: 2, alignItems: "center", justifyContent: "center" },
  navDisabled: { opacity: 0.3 },
  navText: { color: "rgba(237,238,233,0.7)", fontSize: 11 },
  intro: { fontSize: 12.5, color: C.ink60, lineHeight: 19, marginBottom: 14 },
  foot: { fontSize: 9.5, color: C.ink60, lineHeight: 15, padding: 10, marginTop: 6 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8 },
  statusText: { color: "rgba(237,238,233,0.75)", fontSize: 10 },
  statusHint: { color: "rgba(237,238,233,0.45)", fontSize: 9.5 },
});

function relTime(d) {
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 10) return "방금";
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  return `${hr}시간 전`;
}
