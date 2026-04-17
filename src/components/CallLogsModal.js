import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";

function LogRow({ log, index, total, colors }) {
  const ok = log.status === "answered";
  const color = ok ? colors.green : colors.red;

  return (
    <View
      className="flex-row items-center px-3.5 py-2.5"
      style={index < total - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.borderLight } : undefined}
    >
      <View
        className="w-6 h-6 rounded-md items-center justify-center mr-2.5"
        style={{ backgroundColor: ok ? colors.greenDim : colors.redDim }}
      >
        <Text className="text-[10px] font-bold" style={{ color, fontFamily: FONT.mono }}>{total - index}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[11px] font-semibold" style={{ color }}>{ok ? "Answered" : "Missed"}</Text>
        <Text className="text-[9px]" style={{ color: colors.muted, fontFamily: FONT.mono }}>{log.time}</Text>
      </View>
      <Text className="text-[11px] font-bold" style={{ color: colors.text, fontFamily: FONT.mono }}>{log.duration}</Text>
    </View>
  );
}

export default function CallLogsModal({ visible, order, target = "customer", onClose }) {
  const { colors } = useTheme();
  const r = target === "rider";
  const logs = r ? (order?.riderCallLogs || []) : (order?.callLogs || []);
  const attempts = r ? (order?.riderAttempts || 0) : (order?.attempts || 0);
  const talkTime = r ? order?.riderTalkTime : order?.talkTime;
  const lastCall = r ? order?.riderLastCall : order?.lastCall;
  const name = r ? order?.riderName : order?.name;
  const phone = r ? order?.riderPhone : order?.phone;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1" style={{ backgroundColor: colors.overlay }} activeOpacity={1} onPress={onClose} />
      <View
        className="rounded-t-2xl pt-4 pb-8"
        style={{ backgroundColor: colors.cardElevated, borderTopWidth: 1, borderTopColor: colors.border, maxHeight: "78%" }}
      >
        <View className="items-center mb-4">
          <View className="w-8 h-1 rounded-full" style={{ backgroundColor: colors.subtle }} />
        </View>

        <View className="flex-row items-center px-5 mb-3">
          <View className="flex-1">
            <Text className="text-[14px] font-bold" style={{ color: colors.text }}>
              {r ? "Rider" : "Customer"} Call History
            </Text>
            <Text className="text-[10px] mt-0.5" style={{ color: colors.muted, fontFamily: FONT.mono }}>
              {name} · {phone}
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

        <View
          className="flex-row mx-5 mb-3 rounded-lg overflow-hidden"
          style={{ backgroundColor: colors.kpiBg, borderWidth: 1, borderColor: colors.border }}
        >
          {[
            { v: attempts, l: "Calls" },
            { v: talkTime || "—", l: "Talk" },
            { v: lastCall || "—", l: "Last" },
          ].map((s, i) => (
            <View
              key={s.l}
              className="flex-1 items-center py-2.5"
              style={i > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.border } : undefined}
            >
              <Text className="text-[13px] font-bold" style={{ color: colors.text, fontFamily: FONT.mono }}>{s.v}</Text>
              <Text className="text-[8px] font-semibold mt-0.5" style={{ color: colors.muted, letterSpacing: 0.5 }}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View className="mx-5">
          {logs.length > 0 ? (
            <View className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <FlatList
                data={logs}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item, index }) => <LogRow log={item} index={index} total={logs.length} colors={colors} />}
              />
            </View>
          ) : (
            <View className="rounded-lg py-10 items-center" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-[12px]" style={{ color: colors.muted }}>No call logs yet</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}