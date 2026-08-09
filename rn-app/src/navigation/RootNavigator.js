import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RootTabs from "./RootTabs";
import SubscriptionScreen from "../screens/SubscriptionScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={RootTabs} />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
