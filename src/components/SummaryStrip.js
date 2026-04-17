import { View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";

function KpiCard({ value, label, color, colors }) {
  return (
    <View
      className="flex-1 rounded-lg p-2.5 mx-1"
      style={{ backgroundColor: colors.kpiBg, borderWidth: 1, borderColor: colors.border }}
    >
      <Text className="text-[8px] font-semibold mb-1.5" style={{ color: colors.muted, letterSpacing: 0.8 }}>
        {label}
      </Text>
      <Text className="text-[20px] font-bold" style={{ color, fontFamily: FONT.mono, lineHeight: 24 }}>
        {value}
      </Text>
    </View>
  );
}

export default function SummaryStrip({ orders, totalOrders }) {
  const { colors } = useTheme();
  const done = orders.filter((o) => o.status === "answered" || o.status === "delivered").length;
  const missed = orders.filter((o) => o.status === "missed").length;

  return (
    <View className="flex-row px-3 pt-2.5 pb-2">
      <KpiCard value={totalOrders} label="Total Assigned" color={colors.primary} colors={colors} />
      <KpiCard value={done} label="Done" color={colors.green} colors={colors} />
      <KpiCard value={missed} label="Missed" color={colors.red} colors={colors} />
    </View>
  );
}