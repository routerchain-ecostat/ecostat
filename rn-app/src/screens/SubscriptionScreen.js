import React from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView, Linking, ActivityIndicator, Alert,
} from "react-native";
import { C, monoFont } from "../theme/colors";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";
import { PLAN, LEGAL_LINKS } from "../config/iap";

// blocking=true 로 렌더링될 때는 30일 체험이 끝나 앱 전체가 잠긴 상태다.
// 이때는 "닫기"가 없고, 구독하거나 로그아웃하는 것 외에 다른 선택지가 없다.
export default function SubscriptionScreen({ navigation, route, blocking: blockingProp }) {
  const {
    ready, isSubscribed, entitlement, products, priceFor,
    purchasing, restoring, lastError, subscribe, restorePurchases,
    trialDaysLeft, trialActive, trialExpired,
    devSetSubscribed, devExpireTrial, devResetTrial,
  } = useSubscription();
  const { logout } = useAuth();

  const blocking = blockingProp ?? route?.params?.blocking ?? false;

  const onSubscribe = (sku) => {
    Alert.alert(
      PLAN[sku].title,
      `${priceFor(sku)}(으)로 구독을 시작할까요? ${sku === "yearly_premium" ? "매년" : "매월"} 자동으로 결제되며 언제든 해지할 수 있습니다.`,
      [
        { text: "취소", style: "cancel" },
        { text: "구독하기", onPress: () => subscribe(sku) },
      ]
    );
  };

  const onRestore = async () => {
    const r = await restorePurchases();
    if (r.ok) {
      Alert.alert(r.found ? "복원 완료" : "복원할 구매 없음",
        r.found ? "기존 구독을 이 기기에 복원했습니다." : "이 계정으로 구매한 구독을 찾지 못했습니다.");
    } else {
      Alert.alert("복원 실패", "구매 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const onLogout = () => {
    Alert.alert("로그아웃", "로그아웃할까요?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {!blocking && navigation && (
          <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 13, color: C.ink60 }}>← 닫기</Text>
          </Pressable>
        )}

        <Text style={styles.eyebrow}>{blocking ? "무료 체험 종료" : "구독"}</Text>
        <Text style={styles.title}>
          {blocking ? "30일 무료 체험이 끝났습니다" : "거시 관제탑 프리미엄"}
        </Text>
        <Text style={styles.desc}>
          {blocking
            ? "이제부터는 구독해야 5개국 전체 지표, 26개 원자재, 자동 실시간 갱신을 계속 이용할 수 있습니다."
            : "5개국 전체 지표, 26개 원자재, 자동 실시간 갱신을 계속 이용하려면 구독이 필요합니다."}
        </Text>

        {!blocking && trialActive && (
          <View style={styles.trialBox}>
            <Text style={styles.trialTitle}>무료 체험 중 · D-{trialDaysLeft}</Text>
            <Text style={styles.trialSub}>체험이 끝나면 구독해야 계속 이용할 수 있습니다.</Text>
          </View>
        )}

        {isSubscribed && (
          <View style={styles.activeBox}>
            <Text style={styles.activeTitle}>구독 중</Text>
            <Text style={styles.activeSub}>
              {PLAN[entitlement.productId]?.title || entitlement.productId} ·{" "}
              {new Date(entitlement.purchaseTime).toLocaleDateString("ko-KR")} 시작
            </Text>
          </View>
        )}

        {!ready ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={C.ink} />
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 6 }}>
            {Object.values(PLAN).map((p) => {
              const busy = purchasing === p.id;
              const disabled = isSubscribed || busy;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => onSubscribe(p.id)}
                  disabled={disabled}
                  style={[styles.card, isSubscribed && entitlement?.productId === p.id && styles.cardActive]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View>
                      <Text style={styles.cardTitle}>{p.title}</Text>
                      <Text style={styles.cardPeriod}>{p.period} 자동 결제</Text>
                    </View>
                    {p.badge && (
                      <View style={styles.badge}><Text style={styles.badgeText}>{p.badge}</Text></View>
                    )}
                  </View>
                  <Text style={styles.cardPrice}>{priceFor(p.id)}</Text>
                  <View style={styles.cardBtn}>
                    {busy ? (
                      <ActivityIndicator color={C.paper} />
                    ) : (
                      <Text style={styles.cardBtnText}>
                        {isSubscribed && entitlement?.productId === p.id ? "구독 중" : "구독하기"}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {lastError && (
          <Text style={styles.errText}>
            {products.length === 0
              ? "스토어에서 상품 정보를 아직 불러오지 못했습니다 (개발 환경이거나 스토어 상품 등록 전일 수 있습니다). 아래 표시된 가격은 참고용 기본값입니다."
              : lastError}
          </Text>
        )}

        <Pressable onPress={onRestore} disabled={restoring} style={styles.restoreBtn}>
          {restoring ? <ActivityIndicator color={C.ink} /> : <Text style={styles.restoreText}>구매 복원하기</Text>}
        </Pressable>

        <View style={styles.legal}>
          <Text style={styles.legalText}>
            구독은 결제 확인 시 자동으로 시작되며, 현재 구독 기간이 끝나기 24시간 전까지 해지하지 않으면
            같은 기간만큼 자동 갱신됩니다. 요금은 Apple ID / Google 계정에 청구됩니다.
          </Text>
          <Text style={styles.legalText}>
            구독 관리·해지는 iOS는 설정 → Apple ID → 구독에서, Android는 Play 스토어 → 결제 및 구독에서
            할 수 있습니다.
          </Text>
          <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
            <Pressable onPress={() => Linking.openURL(LEGAL_LINKS.terms)}>
              <Text style={styles.legalLink}>이용약관</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}>
              <Text style={styles.legalLink}>개인정보처리방침</Text>
            </Pressable>
          </View>
        </View>

        {blocking && (
          <Pressable onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>
        )}

        {__DEV__ && (
          <View style={styles.devBox}>
            <Text style={styles.devLabel}>개발자 전용 — 실제 결제·시간 경과 없이 상태 전환</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <Pressable style={styles.devBtn} onPress={() => devSetSubscribed(true)}>
                <Text style={styles.devBtnText}>구독 중으로 설정</Text>
              </Pressable>
              <Pressable style={styles.devBtn} onPress={() => devSetSubscribed(false)}>
                <Text style={styles.devBtnText}>구독 해제</Text>
              </Pressable>
              <Pressable style={styles.devBtn} onPress={devExpireTrial}>
                <Text style={styles.devBtnText}>체험 즉시 만료</Text>
              </Pressable>
              <Pressable style={styles.devBtn} onPress={devResetTrial}>
                <Text style={styles.devBtnText}>체험 30일 리셋</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const mono = monoFont();

const styles = StyleSheet.create({
  eyebrow: { fontSize: 10, letterSpacing: 1.5, color: C.ink60, fontFamily: mono },
  title: { fontSize: 24, fontWeight: "700", color: C.ink, marginTop: 4 },
  desc: { fontSize: 13, color: C.ink60, lineHeight: 20, marginTop: 8, marginBottom: 18 },

  trialBox: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid, borderRadius: 4, padding: 14, marginBottom: 16 },
  trialTitle: { fontSize: 14, fontWeight: "700", color: C.ink },
  trialSub: { fontSize: 11.5, color: C.ink60, marginTop: 3 },

  activeBox: { backgroundColor: "#4A6B3D", borderRadius: 4, padding: 14, marginBottom: 16 },
  activeTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  activeSub: { color: "rgba(255,255,255,0.85)", fontSize: 11.5, marginTop: 3 },

  card: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid, borderRadius: 4, padding: 16 },
  cardActive: { borderColor: "#4A6B3D", borderWidth: 2 },
  cardTitle: { fontSize: 15.5, fontWeight: "700", color: C.ink },
  cardPeriod: { fontSize: 11, color: C.ink60, marginTop: 2 },
  cardPrice: { fontSize: 26, fontWeight: "700", color: C.ink, fontFamily: mono, marginTop: 10 },
  badge: { backgroundColor: C.ink, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: C.paper, fontSize: 9.5, fontWeight: "700" },
  cardBtn: { backgroundColor: C.ink, borderRadius: 2, paddingVertical: 11, alignItems: "center", marginTop: 12 },
  cardBtnText: { color: C.paper, fontSize: 13, fontWeight: "600" },

  errText: { fontSize: 11, color: C.ink60, lineHeight: 16, marginTop: 12 },

  restoreBtn: { alignItems: "center", paddingVertical: 14, marginTop: 6 },
  restoreText: { fontSize: 12.5, color: C.ink, fontWeight: "600", textDecorationLine: "underline" },

  legal: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.grid },
  legalText: { fontSize: 10.5, color: C.ink60, lineHeight: 16, marginBottom: 6 },
  legalLink: { fontSize: 11, color: C.ink, fontWeight: "600", textDecorationLine: "underline" },

  logoutBtn: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  logoutText: { fontSize: 12.5, color: C.price, fontWeight: "600" },

  devBox: { marginTop: 24, backgroundColor: "#FFF3D6", borderRadius: 4, padding: 12 },
  devLabel: { fontSize: 10, color: "#7A5A00", fontWeight: "700" },
  devBtn: { borderWidth: 1, borderColor: "#7A5A00", borderRadius: 2, paddingVertical: 6, paddingHorizontal: 10 },
  devBtnText: { fontSize: 10.5, color: "#7A5A00" },
});
