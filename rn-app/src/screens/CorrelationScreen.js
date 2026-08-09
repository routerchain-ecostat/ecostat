import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { C } from "../theme/colors";
import { useApp } from "../context/AppContext";
import CorrelationMatrix from "../components/CorrelationMatrix";

const INTRO = {
  US: "미국은 6월 실업률이 내렸지만 참가율이 함께 무너졌고, 주택착공은 19% 급증했지만 허가는 줄었습니다.",
  KR: "한국은 6월 수출이 70.9% 폭증했지만 취업자는 6.3만 명 증가에 그쳤고 고용률은 오히려 내렸습니다.",
  JP: "일본은 6월 종합 물가가 올랐지만 일본은행이 실제로 보는 코어코어는 오히려 내렸습니다.",
  EA: "유로존은 6월 물가가 둔화했지만 1분기 GDP는 마이너스로 돌아섰습니다.",
  CN: "중국은 6월 수출이 27% 급증했지만 고정자산투자는 -5.7%로 내수와 대외가 정반대로 움직였습니다.",
};

const CHECKLIST = [
  ["상시", "금 (LBMA/COMEX)", "발표 직후 금의 반응이 시장의 해석입니다.", C.gold],
  ["매주 목요일", "신규 실업수당 청구", "가장 빠른 고용 경보기. 4주 평균 25만 건 돌파 여부만 봅니다.", C.labor],
  ["매월 1·3영업일", "ISM 제조·서비스 PMI", "'지불가격'은 PPI에, '고용'은 NFP에 선행합니다.", C.senti],
  ["첫째 금요일", "고용보고서", "NFP·실업률·참가율·임금을 반드시 한 세트로 읽습니다.", C.labor],
  ["10~15일", "CPI → PPI", "근원과 헤드라인의 격차로 인플레의 출처를 판별합니다.", C.price],
  ["말일 전후", "PCE · GDP · FOMC", "연준이 실제로 보는 숫자. 금리 경로가 여기서 확정됩니다.", C.growth],
];

export default function CorrelationScreen() {
  const { meta, country, corSel, corrC, SH, CHAIN_C } = useApp();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>지표는 왜 같이 봐야 하는가</Text>
        <Text style={styles.intro}>
          지표 하나로 판단하면 거의 항상 틀립니다. {INTRO[country]} 아래 격자의 칸을 누르면 두 지표를 잇는
          경로가 나옵니다. 값은 표본 상관계수가 아니라 구조적 관계의 방향과 세기입니다.
        </Text>

        <CorrelationMatrix />

        <View style={styles.panel}>
          {corSel && corrC(corSel[0], corSel[1]) ? (
            <>
              <Text style={styles.panelTag}>전달 경로</Text>
              <Text style={styles.panelTitle}>{SH(corSel[0])} ↔ {SH(corSel[1])}</Text>
              <Text style={[styles.panelStrength, { color: corrC(corSel[0], corSel[1])[0] > 0 ? C.growth : C.price }]}>
                {corrC(corSel[0], corSel[1])[0] > 0 ? "같은 방향" : "반대 방향"} · 강도{" "}
                {Math.abs(corrC(corSel[0], corSel[1])[0]).toFixed(2)}
              </Text>
              <Text style={styles.panelBody}>{corrC(corSel[0], corSel[1])[1]}</Text>
            </>
          ) : (
            <>
              <Text style={styles.panelTag}>{meta.name} · 2026년 7월의 인과 사슬</Text>
              {CHAIN_C.map(([a, b], i) => (
                <View key={i} style={styles.chainRow}>
                  <Text style={styles.chainNum}>{String(i + 1).padStart(2, "0")}</Text>
                  <View style={styles.chainBody}>
                    <Text style={styles.chainA}>{a}</Text>
                    <Text style={styles.chainB}>{b}</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.chainHint}>격자의 칸을 누르면 해당 관계의 상세 설명으로 바뀝니다.</Text>
            </>
          )}
        </View>

        {country === "US" && (
          <>
            <Text style={styles.title2}>실전 점검 순서</Text>
            {CHECKLIST.map(([when, what, how, col]) => (
              <View key={what} style={[styles.checkCard, { borderTopColor: col }]}>
                <Text style={styles.checkWhen}>{when}</Text>
                <Text style={styles.checkWhat}>{what}</Text>
                <Text style={styles.checkHow}>{how}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 21, fontWeight: "700", color: C.ink, marginBottom: 8 },
  title2: { fontSize: 18, fontWeight: "700", color: C.ink, marginTop: 22, marginBottom: 10 },
  intro: { fontSize: 12.5, color: C.ink60, lineHeight: 19, marginBottom: 16 },
  panel: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid, borderRadius: 2, padding: 16, marginTop: 16 },
  panelTag: { fontSize: 9.5, letterSpacing: 1, color: C.ink60, marginBottom: 8 },
  panelTitle: { fontSize: 19, fontWeight: "700", color: C.ink, marginBottom: 4 },
  panelStrength: { fontSize: 11.5, marginBottom: 10, fontWeight: "600" },
  panelBody: { fontSize: 13, lineHeight: 21, color: C.ink },
  chainRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  chainNum: { fontSize: 9, color: C.ink60, width: 16, paddingTop: 3 },
  chainBody: { flex: 1, borderLeftWidth: 2, borderLeftColor: C.grid, paddingLeft: 10 },
  chainA: { fontSize: 12.5, fontWeight: "600", color: C.ink },
  chainB: { fontSize: 11.5, color: C.ink60, lineHeight: 16, marginTop: 1 },
  chainHint: { fontSize: 11, color: C.ink60, borderTopWidth: 1, borderTopColor: C.grid, paddingTop: 10, marginTop: 4 },
  checkCard: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid, borderTopWidth: 3, padding: 13, borderRadius: 2, marginBottom: 10 },
  checkWhen: { fontSize: 9.5, letterSpacing: 1, color: C.ink60 },
  checkWhat: { fontSize: 13.5, fontWeight: "600", color: C.ink, marginTop: 4, marginBottom: 5 },
  checkHow: { fontSize: 11.5, color: C.ink60, lineHeight: 17 },
});
