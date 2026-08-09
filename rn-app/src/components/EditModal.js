import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { C, monoFont } from "../theme/colors";

export default function EditModal({ visible, indicator, onClose, onSave }) {
  const [val, setVal] = useState("");
  const [prev, setPrev] = useState("");
  const [sub, setSub] = useState("");

  useEffect(() => {
    if (visible && indicator) {
      setVal(String(indicator.val ?? ""));
      setPrev(String(indicator.prev ?? ""));
      setSub(indicator.sub || "");
    }
  }, [visible, indicator]);

  if (!indicator) return null;

  const save = () => {
    const v = parseFloat(String(val).replace(/,/g, ""));
    if (isNaN(v)) return;
    const p = parseFloat(String(prev).replace(/,/g, ""));
    onSave(indicator.id, {
      val: v,
      prev: isNaN(p) ? indicator.prev : p,
      sub: sub || indicator.sub,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{indicator.name}</Text>
          <Text style={styles.label}>최신 발표값 ({indicator.unit})</Text>
          <TextInput style={styles.input} value={val} onChangeText={setVal} keyboardType="numeric" />
          <Text style={styles.label}>직전 발표값</Text>
          <TextInput style={styles.input} value={prev} onChangeText={setPrev} keyboardType="numeric" />
          <Text style={styles.label}>기준 시점 (예: 2026년 7월)</Text>
          <TextInput style={styles.input} value={sub} onChangeText={setSub} />
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>취소</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={save}>
              <Text style={styles.btnText}>저장</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(22,32,43,0.55)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: C.paper2, borderRadius: 4, padding: 18 },
  title: { fontSize: 15, fontWeight: "600", color: C.ink, marginBottom: 12 },
  label: { fontSize: 11, color: C.ink60, marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: C.grid, borderRadius: 2, padding: 9,
    fontSize: 13, fontFamily: monoFont(), color: C.ink, backgroundColor: C.paper,
  },
  row: { flexDirection: "row", gap: 10, marginTop: 18, justifyContent: "flex-end" },
  btn: { borderWidth: 1, borderColor: C.ink, backgroundColor: C.ink, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 2 },
  btnText: { color: C.paper, fontSize: 12, fontWeight: "600" },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: C.ink, fontSize: 12 },
});
