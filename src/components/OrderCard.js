import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";

function Badge({ label, color, bg, border }) {
  return (
    <View className="rounded px-2 py-0.5" style={{ backgroundColor: bg, borderWidth: 1, borderColor: border }}>
      <Text className="text-[7px] font-bold" style={{ color, letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );
}

function ContactRow({ label, name, phone, callColor, callBg, callBorder, onCall, onLogs, attempts, disabled, colors }) {
  const hasLogs = attempts > 0;

  return (
    <View className="flex-row items-center py-2">
      {/* Label */}
      <View className="w-7 h-7 rounded-md items-center justify-center mr-2.5" style={{ backgroundColor: colors.glass }}>
        <Text className="text-[8px] font-bold" style={{ color: colors.muted }}>{label}</Text>
      </View>

      {/* Info */}
      <View className="flex-1 mr-2">
        <Text className="text-[12px] font-semibold" style={{ color: colors.text }} numberOfLines={1}>
          {name || "—"}
        </Text>
        <Text className="text-[10px]" style={{ color: colors.muted, fontFamily: FONT.mono }} numberOfLines={1}>
          {phone || "—"}
        </Text>
      </View>

      {/* Call */}
      <TouchableOpacity
        className="w-8 h-8 rounded-lg items-center justify-center mr-1.5"
        style={{
          backgroundColor: callBg,
          borderWidth: 1,
          borderColor: callBorder,
          opacity: disabled ? 0.15 : 1,
        }}
        onPress={onCall}
        disabled={disabled}
        activeOpacity={0.55}
      >
        <Text className="text-[13px]">📞</Text>
      </TouchableOpacity>

      {/* Logs */}
      <TouchableOpacity
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: hasLogs ? callBorder : colors.border,
        }}
        onPress={onLogs}
        activeOpacity={0.55}
      >
        <Text className="text-[12px]">📋</Text>
        {hasLogs && (
          <View
            className="absolute -top-1 -right-1 rounded-full items-center justify-center"
            style={{ backgroundColor: callColor, minWidth: 14, height: 14, paddingHorizontal: 2 }}
          >
            <Text className="text-[7px] font-bold" style={{ color: "#fff", fontFamily: FONT.mono }}>{attempts}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function OrderCard({
  order,
  isActive,
  onCallCustomer,
  onCallRider,
  onViewCustomerLogs,
  onViewRiderLogs,
  dimmed,
}) {
  const { colors } = useTheme();
  const displayStatus = isActive ? "calling" : order.status;
  const items = order.items || [];
  const itemText = items.map((i) => `${i.quantity}x ${i.name}`).join("  ·  ");
  const hasStats = (order.attempts || 0) > 0 || (order.riderAttempts || 0) > 0;

  // Color mapping for status categories
  const statusColorMap = {
    pending: { color: colors.amber, bg: colors.amberDim, border: colors.amberBorder },
    answered: { color: colors.green, bg: colors.greenDim, border: colors.greenBorder },
    delivered: { color: colors.green, bg: colors.greenDim, border: colors.greenBorder },
    missed: { color: colors.red, bg: colors.redDim, border: colors.redBorder },
    calling: { color: colors.primary, bg: colors.primaryDim, border: colors.primaryBorder },
  };
  const defaultColor = { color: colors.blue, bg: colors.blueDim, border: colors.blueBorder };
  const stColor = statusColorMap[displayStatus] || defaultColor;
  const stLabel = isActive ? "CALLING" : (order.rawStatus || order.status || "PENDING").toUpperCase();
  const st = { label: stLabel, ...stColor };

  const accent =
    displayStatus === "answered" || displayStatus === "delivered" ? colors.green
    : displayStatus === "missed" ? colors.red
    : displayStatus === "calling" ? colors.primary
    : "transparent";

  return (
    <View
      className="rounded-xl overflow-hidden mb-2"
      style={[
        {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: isActive ? colors.primaryBorder : colors.border,
          borderLeftWidth: accent !== "transparent" ? 3 : 1,
          borderLeftColor: accent !== "transparent" ? accent : (isActive ? colors.primaryBorder : colors.border),
          opacity: dimmed ? 0.2 : 1,
        },
        isActive && {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      {/* Order info */}
      <View className="px-3 pt-2.5 pb-1.5">
        <View className="flex-row items-center mb-1.5">
          <Text className="text-[10px] font-bold mr-2" style={{ color: colors.textSecondary, fontFamily: FONT.mono }}>
            #{order.orderId}
          </Text>
          <Badge label={st.label} color={st.color} bg={st.bg} border={st.border} />
        </View>

        <Text className="text-[13px] font-bold leading-[18px]" style={{ color: colors.text }} numberOfLines={2}>
          {itemText || "No items"}
        </Text>

        {order.address ? (
          <Text className="text-[10px] mt-1" style={{ color: colors.muted }} numberOfLines={1}>
            {order.address}
          </Text>
        ) : null}

        {hasStats && (
          <View className="flex-row mt-2 gap-4">
            {[
              { v: order.talkTime || "—", l: "Talk" },
              { v: order.lastCall || "—", l: "Last" },
            ].map((s) => (
              <View key={s.l}>
                <Text className="text-[10px] font-bold" style={{ color: colors.text, fontFamily: FONT.mono }}>{s.v}</Text>
                <Text className="text-[8px] font-semibold" style={{ color: colors.muted, letterSpacing: 0.5 }}>{s.l}</Text>
              </View>
            ))}
          </View>
        )}

        {order.note && !isActive && (
          <View
            className="rounded-md px-2.5 py-1.5 mt-2"
            style={{ backgroundColor: colors.primaryDim, borderLeftWidth: 2, borderLeftColor: colors.primaryBorder }}
          >
            <Text className="text-[10px] leading-[15px]" style={{ color: colors.primaryLight, fontFamily: FONT.mono }} numberOfLines={2}>
              {order.note}
            </Text>
          </View>
        )}

        {isActive && (
          <View
            className="rounded-lg py-2 mt-2 items-center"
            style={{ backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primaryBorder }}
          >
            <Text className="text-[10px] font-bold" style={{ color: colors.primary, fontFamily: FONT.mono }}>
              Calling — return here when done
            </Text>
          </View>
        )}
      </View>

      {/* Contacts */}
      <View className="px-3 pb-1" style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: 2 }}>
        <ContactRow
          label="C"
          name={order.name}
          phone={order.phone}
          callColor={colors.green}
          callBg={colors.greenDim}
          callBorder={colors.greenBorder}
          onCall={onCallCustomer}
          onLogs={() => onViewCustomerLogs(order)}
          attempts={order.attempts || 0}
          disabled={dimmed || isActive}
          colors={colors}
        />
        <View style={{ height: 1, backgroundColor: colors.borderLight }} />
        <ContactRow
          label="R"
          name={order.riderName}
          phone={order.riderPhone}
          callColor={colors.blue}
          callBg={colors.blueDim}
          callBorder={colors.blueBorder}
          onCall={onCallRider}
          onLogs={() => onViewRiderLogs(order)}
          attempts={order.riderAttempts || 0}
          disabled={dimmed}
          colors={colors}
        />
      </View>
    </View>
  );
}