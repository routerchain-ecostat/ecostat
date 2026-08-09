import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { C } from "../theme/colors";
import IndicatorsScreen from "../screens/IndicatorsScreen";
import CommoditiesScreen from "../screens/CommoditiesScreen";
import CalendarScreen from "../screens/CalendarScreen";
import CorrelationScreen from "../screens/CorrelationScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const ICON = { 지표: "📊", 원자재: "🛢️", 발표일: "🗓", 상관관계: "🔗", 설정: "⚙️" };

export default function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: C.ink60,
        tabBarStyle: { backgroundColor: C.paper2, borderTopColor: C.grid },
        tabBarIcon: () => <Text style={{ fontSize: 16 }}>{ICON[route.name]}</Text>,
        tabBarLabelStyle: { fontSize: 10.5 },
      })}
    >
      <Tab.Screen name="지표" component={IndicatorsScreen} />
      <Tab.Screen name="원자재" component={CommoditiesScreen} />
      <Tab.Screen name="발표일" component={CalendarScreen} />
      <Tab.Screen name="상관관계" component={CorrelationScreen} />
      <Tab.Screen name="설정" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
