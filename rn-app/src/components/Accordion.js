import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { C } from "../theme/colors";

export default function Accordion({ title, defaultOpen = false, color = C.ink60, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.header} hitSlop={6}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.plus, open && styles.plusOpen]}>＋</Text>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderTopColor: C.grid, marginTop: 11, paddingTop: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 9.5, letterSpacing: 1, color: C.ink60, textTransform: "none" },
  plus: { fontSize: 13, color: C.ink60 },
  plusOpen: { transform: [{ rotate: "45deg" }] },
  body: { marginTop: 11 },
});
