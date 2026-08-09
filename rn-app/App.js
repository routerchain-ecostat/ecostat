import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { AppProvider, useApp } from "./src/context/AppContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CommoditiesProvider } from "./src/context/CommoditiesContext";
import { SubscriptionProvider, useSubscription } from "./src/context/SubscriptionContext";
import { C } from "./src/theme/colors";
import RootNavigator from "./src/navigation/RootNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import SubscriptionScreen from "./src/screens/SubscriptionScreen";

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={C.ink} />
    </View>
  );
}

// AppContext(수정값·심볼 등)가 AsyncStorage에서 로딩을 마칠 때까지 대기
function AppGate() {
  const { ready } = useApp();
  if (!ready) return <Loading />;
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

// 30일 무료 체험이 끝났는데 구독하지 않았으면 앱 전체를 잠그고 구독 화면만 보여준다.
// 체험 중이거나 구독 중이면 평소대로 앱 전체를 보여준다.
function AccessGate() {
  const { ready, hasAccess } = useSubscription();
  if (!ready) return <Loading />;
  if (!hasAccess) return <SubscriptionScreen blocking />;
  return <AppGate />;
}

function Gate() {
  const { ready, user } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <LoginScreen />;
  return (
    <AppProvider>
      <CommoditiesProvider>
        <SubscriptionProvider>
          <AccessGate />
        </SubscriptionProvider>
      </CommoditiesProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={C.paper} />
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.paper },
});
