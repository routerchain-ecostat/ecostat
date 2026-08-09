import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { C, FAM } from "../theme/colors";
import { useApp } from "../context/AppContext";

export default function CalendarScreen({ navigation }) {
  const { meta, BASE, CAL_C } = useApp();

  const go = (id) => {
    navigation.navigate("지표", { jumpTo: id });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>다가오는 발표</Text>
        <Text style={styles.sub}>{meta.name} · 오늘 이후 4주</Text>

        {CAL_C.map(([day, what, id], i) => {
          const owner = BASE.find((d) => d.id === id);
          const col = owner ? FAM[owner.fam] || C.ink60 : C.ink60;
          return (
            <Pressable key={i} onPress={() => go(id)} style={[styles.row, { borderLeftColor: col }]}>
              <Text style={styles.day}>{day}</Text>
              <Text style={styles.what}>{what}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.note}>
          발표 시각은 대부분 08:30 ET(한국시간 21:30, 서머타임 기준). ISM·JOLTS·신축매매·미시간은
          10:00 ET(한국시간 23:00). 공휴일·자료 수정에 따라 하루 이틀 달라질 수 있습니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: C.ink },
  sub: { fontSize: 11, color: C.ink60, marginTop: 3, marginBottom: 16 },
  row: {
    flexDirection: "row", gap: 11, alignItems: "baseline",
    backgroundColor: C.paper2, borderWidth: 1, borderColor: C.grid, borderLeftWidth: 3,
    padding: 11, borderRadius: 2, marginBottom: 8,
  },
  day: { fontSize: 10.5, color: C.ink60, minWidth: 56 },
  what: { fontSize: 12.5, color: C.ink, flex: 1, lineHeight: 18 },
  note: { fontSize: 9.5, color: C.ink60, lineHeight: 15, marginTop: 12 },
});
