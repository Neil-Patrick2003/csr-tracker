import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";

export default function NotesModal({ visible, order, onSave, onClose }) {
  const { colors } = useTheme();
  const [noteText, setNoteText] = useState("");

  useEffect(() => { if (order) setNoteText(order.note || ""); }, [order]);
  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1" style={{ backgroundColor: colors.overlay }} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          className="rounded-t-2xl px-5 pt-4 pb-8"
          style={{ backgroundColor: colors.cardElevated, borderTopWidth: 1, borderTopColor: colors.border }}
        >
          <View className="items-center mb-4">
            <View className="w-8 h-1 rounded-full" style={{ backgroundColor: colors.subtle }} />
          </View>

          <View className="flex-row items-center mb-4">
            <View className="flex-1">
              <Text className="text-[14px] font-bold" style={{ color: colors.text }}>Delivery Notes</Text>
              <Text className="text-[10px] mt-0.5" style={{ color: colors.muted, fontFamily: FONT.mono }}>
                #{order.orderId} · {order.name}
              </Text>
            </View>
            <TouchableOpacity
              className="w-7 h-7 rounded-md items-center justify-center"
              style={{ backgroundColor: colors.glass }}
              onPress={onClose}
            >
              <Text style={{ color: colors.muted, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className="rounded-lg px-3.5 py-3 text-[13px] mb-4"
            style={{
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              fontFamily: FONT.mono,
              minHeight: 88,
              textAlignVertical: "top",
              lineHeight: 20,
            }}
            placeholder="Type notes..."
            placeholderTextColor={colors.muted}
            multiline
            value={noteText}
            onChangeText={setNoteText}
            autoFocus
          />

          <View className="flex-row gap-2.5">
            <TouchableOpacity
              className="flex-1 rounded-lg py-3 items-center"
              style={{ backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border }}
              onPress={onClose}
              activeOpacity={0.6}
            >
              <Text className="text-[13px] font-semibold" style={{ color: colors.muted }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-lg py-3 items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => onSave(order.id, noteText)}
              activeOpacity={0.7}
            >
              <Text className="text-[13px] font-bold" style={{ color: "#fff" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}