import React, { useCallback, useRef, useState } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet, SafeAreaView } from "react-native";
import { C } from "../theme/colors";
import { useApp } from "../context/AppContext";
import { COUNTRY_LIST, IND_US, CDATA } from "../data/data";
import CountrySelector from "../components/CountrySelector";
import TemperatureStrip from "../components/TemperatureStrip";
import YearPicker from "../components/YearPicker";
import FamilyFilter from "../components/FamilyFilter";
import IndicatorCard from "../components/IndicatorCard";
import YearCard from "../components/YearCard";

export default function IndicatorsScreen({ route }) {
  const {
    meta, BASE, D, year, famFilter, ERAS, country, setCountry,
    refreshAll, marketRefreshing, macroRefreshing, lastMarketRefresh, lastMacroRefresh, macroError,
  } = useApp();
  const yMode = year !== 2026;
  const scrollRef = useRef(null);
  const offsets = useRef({});

  const list = (yMode ? BASE : D).filter((d) => famFilter === "전체" || d.fam === famFilter);
  const era = ERAS[year];
  const refreshing = marketRefreshing || macroRefreshing;
  const lastAny = [lastMarketRefresh, lastMacroRefresh].filter(Boolean).sort((a, b) => b - a)[0];
  const statusText = refreshing
    ? "자동 갱신 중…"
    : lastAny
    ? `자동 갱신 · ${relTime(lastAny)}`
    : "자동 갱신 대기 중";

  const jump = useCallback((id) => {
    const y = offsets.current[id];
    if (y != null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(y - 80, 0), animated: true });
    }
  }, []);

  // 캘린더 탭 등 다른 화면에서 특정 지표로 이동해달라는 요청이 왔을 때.
  // 그 지표가 다른 나라 소속이면 먼저 나라를 바꾼 뒤 스크롤한다.
  React.useEffect(() => {
    const target = route?.params?.jumpTo;
    if (!target) return;
    const inCurrent = BASE.some((d) => d.id === target);
    if (!inCurrent) {
      const owner = COUNTRY_LIST.find((c) => {
        const list = c.id === "US" ? IND_US : CDATA[c.id].ind;
        return list.some((d) => d.id === target);
      });
      if (owner && owner.id !== country) setCountry(owner.id);
    }
    setTimeout(() => jump(target), inCurrent ? 250 : 500);
  }, [route?.params?.jumpTo]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={styles.header}>
        <Text style={styles.hsub}>출처 · {meta.sub}</Text>
        <Text style={styles.htitle}>{meta.name} 거시지표 관제탑</Text>
        <Text style={styles.hcount}>{BASE.length}개 지표 · 정의 · 발표일정 · 상호작용</Text>
        <CountrySelector />
        <TemperatureStrip onJump={jump} />
        <YearPicker />
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{statusText}</Text>
          <Text style={styles.statusHint}>아래로 당기면 즉시 갱신</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={C.ink} />}
      >
        <View style={styles.era}>
          <Text style={styles.eraTag}>{meta.name} {year}년 · 국면</Text>
          <Text style={styles.eraTitle}>{era[0]}</Text>
          <Text style={styles.eraBody}>{era[1]}</Text>
        </View>

        <View style={{ paddingHorizontal: 2, marginBottom: 4 }}>
          <FamilyFilter />
        </View>

        {list.map((d) => (
          <View key={d.id} onLayout={(e) => { offsets.current[d.id] = e.nativeEvent.layout.y; }}>
            {yMode ? <YearCard d={d} year={year} /> : <IndicatorCard d={d} />}
          </View>
        ))}

        {macroError && !yMode && (
          <Text style={styles.macroErr}>
            자동 갱신(웹 검색 기반) 연결에 실패했습니다: {macroError} — 아래 값은 내장된 시드 데이터입니다.
          </Text>
        )}

        <Text style={styles.foot}>
          {yMode
            ? `${meta.name} ${year}년 값은 지표별 연말 또는 연평균 기준입니다. 2016~2024년은 확정치, 2025년은 근사치, 2026년은 연중 최신치입니다.`
            : "기준 2026-07-29 · 채워진 점 = 공표 확인치, 빈 점 = 추세 보간치 · 출처는 각 카드의 원문 ↗ 링크"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: C.ink, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 4 },
  hsub: { color: C.ink60, fontSize: 10, marginBottom: 4 },
  htitle: { color: C.paper, fontSize: 22, fontWeight: "700" },
  hcount: { color: "rgba(237,238,233,0.6)", fontSize: 11, marginTop: 3, marginBottom: 12 },
  era: { backgroundColor: C.ink, borderRadius: 2, padding: 16, marginBottom: 14 },
  eraTag: { color: "rgba(237,238,233,0.6)", fontSize: 9.5, letterSpacing: 1 },
  eraTitle: { color: C.paper, fontSize: 19, fontWeight: "700", marginTop: 5 },
  eraBody: { color: "rgba(237,238,233,0.92)", fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  foot: { fontSize: 9.5, color: C.ink60, lineHeight: 15, padding: 10, marginTop: 6 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  statusText: { color: "rgba(237,238,233,0.75)", fontSize: 10 },
  statusHint: { color: "rgba(237,238,233,0.45)", fontSize: 9.5 },
  macroErr: { fontSize: 10.5, color: C.price, lineHeight: 16, padding: 10, backgroundColor: C.paper2, borderRadius: 2, marginTop: 6 },
});

// "3분 전", "방금" 같은 상대 시간 표기
function relTime(d) {
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 10) return "방금";
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  return `${hr}시간 전`;
}
