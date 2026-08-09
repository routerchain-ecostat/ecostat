import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, SafeAreaView, Linking, Alert, Image } from "react-native";
import { C, monoFont } from "../theme/colors";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useCommodities } from "../context/CommoditiesContext";
import { useSubscription } from "../context/SubscriptionContext";
import { PLAN } from "../config/iap";
import { COUNTRY_LIST, IND_US, CDATA } from "../data/data";
import { isMktId, isCommodityId, SYM_DEF, COMMODITY_SYM_DEF } from "../api/quotes";

export default function SettingsScreen({ navigation }) {
  const { meta, country, BASE, symbolFor, saveSymbol, resetSymbols, resetEdits } = useApp();
  const { user, logout } = useAuth();
  const { isSubscribed, entitlement, trialActive, trialDaysLeft } = useSubscription();
  const {
    BASE: COMMOD_BASE,
    symbolFor: commoditySymbolFor,
    saveSymbol: saveCommoditySymbol,
    resetSymbols: resetCommoditySymbols,
    resetEdits: resetCommodityEdits,
  } = useCommodities();
  const [draft, setDraft] = useState({});
  const [commodDraft, setCommodDraft] = useState({});
  const [msg, setMsg] = useState(null);
  const [commodMsg, setCommodMsg] = useState(null);

  const doLogout = () => {
    Alert.alert("로그아웃", "이 기기에 저장된 로그인 정보를 지웁니다. 지표 수정값은 그대로 남습니다.", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: logout },
    ]);
  };

  const saveCommodSyms = () => {
    Object.entries(commodDraft).forEach(([id, sym]) => saveCommoditySymbol(id, sym.trim()));
    setCommodMsg("원자재 심볼을 저장했습니다.");
    setTimeout(() => setCommodMsg(null), 4000);
  };

  const doResetCommodSyms = () => {
    resetCommoditySymbols();
    setCommodDraft({});
    setCommodMsg("기본값으로 되돌렸습니다.");
    setTimeout(() => setCommodMsg(null), 4000);
  };

  const doResetCommodEdits = () => {
    Alert.alert("초기화", "원자재 탭에서 직접 입력하거나 실시간으로 받아온 값을 모두 지웁니다.", [
      { text: "취소", style: "cancel" },
      { text: "초기화", style: "destructive", onPress: resetCommodityEdits },
    ]);
  };

  const marketRows = useMemo(() => {
    const rows = [];
    COUNTRY_LIST.forEach((c) => {
      const list = c.id === "US" ? IND_US : CDATA[c.id].ind;
      list.filter((d) => isMktId(d.id)).forEach((d) => {
        rows.push({ cname: c.name, id: d.id, name: d.name });
      });
    });
    return rows;
  }, []);

  const save = () => {
    Object.entries(draft).forEach(([id, sym]) => saveSymbol(id, sym.trim()));
    setMsg("심볼을 저장했습니다. 다음 자동 갱신부터(또는 화면을 당기면 즉시) 반영됩니다.");
    setTimeout(() => setMsg(null), 4000);
  };

  const doResetSymbols = () => {
    resetSymbols();
    setDraft({});
    setMsg("기본값으로 되돌렸습니다.");
    setTimeout(() => setMsg(null), 4000);
  };

  const doResetEdits = () => {
    Alert.alert("초기화", "직접 입력한 값과 실시간으로 받아온 값을 모두 지우고 원래 데이터로 되돌립니다.", [
      { text: "취소", style: "cancel" },
      { text: "초기화", style: "destructive", onPress: resetEdits },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>설정</Text>

        <Section heading="구독">
          <View style={styles.subRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subStatus}>
                {isSubscribed
                  ? `구독 중 · ${PLAN[entitlement.productId]?.title || ""}`
                  : trialActive
                  ? `무료 체험 중 · D-${trialDaysLeft}`
                  : "무료 체험 종료"}
              </Text>
              <Text style={styles.p}>
                {isSubscribed
                  ? "5개국 전체 지표·26개 원자재·자동 실시간 갱신을 모두 이용할 수 있습니다."
                  : trialActive
                  ? `가입 후 30일간 모든 기능을 무료로 쓸 수 있습니다. 체험이 끝나면 월 3,000원 또는 연 20,000원 구독이 필요합니다.`
                  : "체험 기간이 끝났습니다. 구독해야 다시 모든 기능을 이용할 수 있습니다."}
              </Text>
            </View>
          </View>
          <Pressable style={styles.btn} onPress={() => navigation?.navigate("Subscription")}>
            <Text style={styles.btnText}>{isSubscribed ? "구독 관리" : "구독하기"}</Text>
          </Pressable>
        </Section>

        <Section heading="계정">
          <View style={styles.acctRow}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInit}>{(user?.name || "?").slice(0, 1)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.acctName}>{user?.name || "게스트"}</Text>
              <Text style={styles.acctSub}>
                {user?.provider === "google" ? "Google 계정" :
                 user?.provider === "apple" ? "Apple 계정" : "게스트 모드 (기기에만 저장)"}
                {user?.email ? ` · ${user.email}` : ""}
              </Text>
            </View>
          </View>
          <Pressable style={[styles.btn, styles.btnGhost, { marginTop: 12 }]} onPress={doLogout}>
            <Text style={styles.btnGhostText}>로그아웃</Text>
          </Pressable>
        </Section>

        <Section heading="데이터 갱신 방법">
          <Text style={styles.p}>
            이 앱은 5개국(미국·한국·일본·유로존·중국)의 데이터를 화면을 열면 <Text style={styles.bold}>자동으로</Text> 갱신합니다.
            버튼을 누를 필요가 없습니다.
          </Text>
          <Text style={styles.p}>
            <Text style={styles.bold}>지수·채권·원자재</Text> — Stooq 무료 시세를 5분마다 자동으로 불러옵니다
            (네이티브 앱이라 별도 프록시가 필요 없습니다). 값이 갱신되면 카드에 <Text style={styles.bold}>LIVE</Text> 배지가 붙습니다.
          </Text>
          <Text style={styles.p}>
            <Text style={styles.bold}>나머지 거시지표</Text>(CPI·GDP 등) — 웹 검색 기반으로 30분마다 자동 확인을
            시도합니다. 다만 이 기능은 별도 백엔드 연결이 필요해, 연결이 안 돼 있으면 조용히 건너뛰고 내장된
            시드 데이터를 그대로 보여줍니다.
          </Text>
          <Text style={styles.p}>
            <Text style={styles.bold}>직접 입력</Text> — 자동 갱신과 별개로, 각 지표 카드의 "수치 수정"을 눌러
            값을 손으로 고칠 수도 있습니다.
          </Text>
          <Text style={styles.p}>
            지표·원자재 탭 상단에서 <Text style={styles.bold}>화면을 아래로 당기면</Text> 자동 갱신 주기를
            기다리지 않고 바로 다시 불러옵니다.
          </Text>
        </Section>

        <Section heading="시세 심볼 (지수 · 채권)">
          <Text style={styles.p}>지표 탭이 5분마다 자동으로 이 심볼로 시세를 불러옵니다. 실제와 다르면 아래에서 고치세요. 값은 이 기기에만 저장됩니다.</Text>
          {marketRows.map((r) => (
            <View key={r.id} style={styles.symRow}>
              <Text style={styles.symLabel}>{r.cname} {r.name}</Text>
              <TextInput
                style={styles.symInput}
                defaultValue={symbolFor(r.id) || ""}
                placeholder={SYM_DEF[r.id]}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(t) => setDraft((p) => ({ ...p, [r.id]: t }))}
              />
            </View>
          ))}
          <View style={styles.btnRow}>
            <Pressable style={styles.btn} onPress={save}><Text style={styles.btnText}>심볼 저장</Text></Pressable>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={doResetSymbols}>
              <Text style={styles.btnGhostText}>기본값 복원</Text>
            </Pressable>
          </View>
          {msg && <Text style={styles.msg}>{msg}</Text>}
        </Section>

        <Section heading="시세 심볼 (원자재)">
          <Text style={styles.p}>원자재 탭도 5분마다 자동으로 이 심볼로 시세를 불러옵니다. 선물은 계약월이 바뀌면 심볼이 달라질 수 있어, 안 맞으면 아래에서 고치세요.</Text>
          {COMMOD_BASE.map((d) => (
            <View key={d.id} style={styles.symRow}>
              <Text style={styles.symLabel}>{d.name}</Text>
              <TextInput
                style={styles.symInput}
                defaultValue={commoditySymbolFor(d.id) || ""}
                placeholder={COMMODITY_SYM_DEF[d.id]}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(t) => setCommodDraft((p) => ({ ...p, [d.id]: t }))}
              />
            </View>
          ))}
          <View style={styles.btnRow}>
            <Pressable style={styles.btn} onPress={saveCommodSyms}><Text style={styles.btnText}>심볼 저장</Text></Pressable>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={doResetCommodSyms}>
              <Text style={styles.btnGhostText}>기본값 복원</Text>
            </Pressable>
          </View>
          {commodMsg && <Text style={styles.msg}>{commodMsg}</Text>}
        </Section>

        <Section heading={`${meta.name} 공식 발표처`}>
          {BASE.map((d) => (
            <Pressable key={d.id} onPress={() => Linking.openURL(d.url)} style={styles.linkRow}>
              <Text style={styles.linkOrg}>{d.org}</Text>
              <Text style={styles.linkName}>{d.name} ↗</Text>
            </Pressable>
          ))}
        </Section>

        <Section heading="초기화">
          <Pressable style={[styles.btn, styles.btnDanger]} onPress={doResetEdits}>
            <Text style={styles.btnText}>지표 수정값 초기화</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnDanger, { marginTop: 8 }]} onPress={doResetCommodEdits}>
            <Text style={styles.btnText}>원자재 수정값 초기화</Text>
          </Pressable>
        </Section>

        <Text style={styles.footNote}>
          시드 데이터는 2026년 7월까지 공표·보도된 수치입니다. 차트의 채워진 점은 공표 확인치, 빈 점은 추세
          보간치입니다. 투자 판단의 책임은 이용자에게 있습니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ heading, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionH}>{heading}</Text>
      {children}
    </View>
  );
}

const mono = monoFont();

const styles = StyleSheet.create({
  subRow: { marginBottom: 10 },
  subStatus: { fontSize: 13.5, fontWeight: "700", color: C.ink, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "700", color: C.ink, marginBottom: 16 },
  acctRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.paper },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.grid },
  avatarInit: { fontSize: 16, fontWeight: "700", color: C.ink60 },
  acctName: { fontSize: 14.5, fontWeight: "600", color: C.ink },
  acctSub: { fontSize: 11, color: C.ink60, marginTop: 2 },
  section: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid, borderRadius: 2, padding: 15, marginBottom: 14 },
  sectionH: { fontSize: 15, fontWeight: "600", color: C.ink, marginBottom: 8 },
  p: { fontSize: 12, lineHeight: 19, color: C.ink60, marginBottom: 8 },
  bold: { color: C.ink, fontWeight: "600" },
  symRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  symLabel: { fontSize: 11, color: C.ink60, width: 130 },
  symInput: {
    flex: 1, borderWidth: 1, borderColor: C.grid, borderRadius: 2, paddingVertical: 7, paddingHorizontal: 9,
    fontSize: 12, fontFamily: mono, color: C.ink, backgroundColor: C.paper,
  },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  btn: { backgroundColor: C.ink, borderWidth: 1, borderColor: C.ink, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 2 },
  btnText: { color: C.paper, fontSize: 11.5, fontWeight: "600" },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: C.ink, fontSize: 11.5 },
  btnDanger: { backgroundColor: C.price, borderColor: C.price },
  msg: { fontSize: 11.5, color: C.ink60, marginTop: 8, lineHeight: 17 },
  linkRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.grid },
  linkOrg: { fontSize: 9, letterSpacing: 1, color: C.ink60 },
  linkName: { fontSize: 12.5, color: C.ink, marginTop: 2 },
  footNote: { fontSize: 9.5, color: C.ink60, lineHeight: 15, marginTop: 4, marginBottom: 20 },
});
