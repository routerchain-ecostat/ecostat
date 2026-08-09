import React, { useEffect, useState } from "react";
import {
  View, Text, Pressable, StyleSheet, Platform, Alert, ActivityIndicator, SafeAreaView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { C, monoFont } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { GOOGLE_OAUTH, isGoogleConfigured } from "../config/auth";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, loginGuest } = useAuth();
  const [busy, setBusy] = useState(null); // 'google' | 'apple' | 'guest' | null
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_OAUTH.iosClientId || undefined,
    androidClientId: GOOGLE_OAUTH.androidClientId || undefined,
    webClientId: GOOGLE_OAUTH.webClientId || undefined,
  });

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  // Google 로그인 응답 처리
  useEffect(() => {
    (async () => {
      if (response?.type !== "success") {
        if (response?.type === "error") setBusy(null);
        return;
      }
      try {
        const token = response.authentication?.accessToken;
        const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const info = await res.json();
        await login({
          provider: "google",
          id: info.id,
          name: info.name || info.email,
          email: info.email || null,
          photo: info.picture || null,
        });
      } catch (e) {
        Alert.alert("로그인 실패", "구글 프로필을 가져오지 못했습니다: " + (e.message || ""));
      } finally {
        setBusy(null);
      }
    })();
  }, [response]);

  const onGoogle = () => {
    if (!isGoogleConfigured()) {
      Alert.alert(
        "설정이 필요합니다",
        "src/config/auth.js에 Google OAuth 클라이언트 ID를 채워야 구글 로그인이 동작합니다.\n" +
          "그 전까지는 게스트로 계속하기를 이용해 주세요."
      );
      return;
    }
    setBusy("google");
    promptAsync().catch(() => setBusy(null));
  };

  const onApple = async () => {
    setBusy("apple");
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await login({
        provider: "apple",
        id: cred.user,
        name: cred.fullName?.givenName
          ? `${cred.fullName.givenName} ${cred.fullName.familyName || ""}`.trim()
          : "Apple 사용자",
        email: cred.email || null,
        photo: null,
      });
    } catch (e) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("로그인 실패", "Apple 로그인 중 문제가 발생했습니다: " + (e.message || ""));
      }
    } finally {
      setBusy(null);
    }
  };

  const onGuest = async () => {
    setBusy("guest");
    await loginGuest();
    setBusy(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.ink }}>
      <View style={styles.wrap}>
        <Text style={styles.tag}>BLS · BEA · FRB · BOK · BOJ · ECB · PBOC</Text>
        <Text style={styles.title}>거시 관제탑</Text>
        <Text style={styles.desc}>
          5개국 · 101개 지표 · 11개년 데이터{"\n"}로그인하면 수정값과 설정이 기기 간에 이어집니다
        </Text>

        <View style={styles.btns}>
          <Pressable style={[styles.btn, styles.google]} onPress={onGoogle} disabled={!!busy}>
            {busy === "google" ? <ActivityIndicator color={C.ink} /> : <Text style={styles.googleText}>G  Google로 계속하기</Text>}
          </Pressable>

          {Platform.OS === "ios" && appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={2}
              style={styles.appleBtn}
              onPress={onApple}
            />
          )}

          <Pressable style={[styles.btn, styles.guest]} onPress={onGuest} disabled={!!busy}>
            {busy === "guest" ? <ActivityIndicator color={C.paper} /> : <Text style={styles.guestText}>게스트로 계속하기</Text>}
          </Pressable>
        </View>

        <Text style={styles.foot}>
          게스트로 시작해도 모든 기능을 그대로 쓸 수 있습니다. 로그인은 여러 기기에서
          동일한 수정값·설정을 이어보고 싶을 때만 필요합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const mono = monoFont();

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  tag: { color: "rgba(237,238,233,0.55)", fontSize: 10, letterSpacing: 1.5, fontFamily: mono, textAlign: "center" },
  title: { color: C.paper, fontSize: 34, fontWeight: "700", textAlign: "center", marginTop: 10 },
  desc: { color: "rgba(237,238,233,0.7)", fontSize: 13, textAlign: "center", marginTop: 14, lineHeight: 20 },
  btns: { marginTop: 40, gap: 12 },
  btn: { borderRadius: 2, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  google: { backgroundColor: C.paper },
  googleText: { fontSize: 14, fontWeight: "600", color: C.ink },
  appleBtn: { height: 48 },
  guest: { borderWidth: 1, borderColor: "rgba(237,238,233,0.4)", backgroundColor: "transparent" },
  guestText: { fontSize: 13, color: C.paper },
  foot: { color: "rgba(237,238,233,0.5)", fontSize: 10.5, textAlign: "center", marginTop: 28, lineHeight: 16 },
});
