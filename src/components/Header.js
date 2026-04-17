import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";

function Btn({ children, onPress, onLongPress, style, disabled }) {
  return (
    <TouchableOpacity
      className="h-8 rounded-lg items-center justify-center px-2.5"
      style={[{ minWidth: 32 }, style, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.55}
      disabled={disabled}
    >
      {children}
    </TouchableOpacity>
  );
}

export default function Header({ agentName, subtitle, onRefresh, onLogout, onSyncAll, syncStatus, lastSync, onToggleTheme }) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const isSyncing = syncStatus === "syncing";
  const isSynced = syncStatus === "success";

  const showSyncDetails = () => {
    if (!lastSync) { Alert.alert("Sync", "No sync yet this session."); return; }
    const t = new Date(lastSync.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const nf = lastSync.notFound?.length > 0 ? `\nNot found: ${lastSync.notFound.join(", ")}` : "";
    Alert.alert("Last Sync", `${t}\n${lastSync.count || 0} orders synced${nf}`);
  };

  const pill = { backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" };

  return (
    <View style={{ backgroundColor: colors.primary, paddingTop: insets.top }}>
      <View className="px-4 pt-2 pb-2.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-[16px] font-bold" style={{ color: "#fff", fontFamily: FONT.mono, letterSpacing: -0.4 }}>
              Deliveries
            </Text>
            <Text
              className="text-[9px] font-medium mt-0.5"
              style={{ color: "rgba(255,255,255,0.6)", fontFamily: FONT.mono, letterSpacing: 0.5 }}
              numberOfLines={1}
            >
              {subtitle || agentName}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            {onSyncAll && (
              <Btn
                onPress={onSyncAll}
                onLongPress={showSyncDetails}
                disabled={isSyncing}
                style={{
                  backgroundColor: isSynced ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.18)",
                  paddingHorizontal: 8,
                }}
              >
                <View className="flex-row items-center gap-1">
                  <Text className="text-[10px]" style={{ color: "#fff" }}>
                    {isSynced ? "✓" : isSyncing ? "···" : "⇧"}
                  </Text>
                  <Text className="text-[9px] font-bold" style={{ color: "#fff", fontFamily: FONT.mono }}>
                    {isSynced ? "Done" : isSyncing ? "..." : "Sync"}
                  </Text>
                </View>
              </Btn>
            )}
            <Btn onPress={onRefresh} style={pill}>
              <Text className="text-[13px]" style={{ color: "rgba(255,255,255,0.75)" }}>⟳</Text>
            </Btn>
            {onToggleTheme && (
              <Btn onPress={onToggleTheme} style={pill}>
                <Text className="text-[12px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {mode === "dark" ? "☀︎" : "☾"}
                </Text>
              </Btn>
            )}
            <Btn onPress={onLogout} style={{ backgroundColor: "rgba(239,68,68,0.25)", borderWidth: 1, borderColor: "rgba(239,68,68,0.35)" }}>
              <Text className="text-[11px]" style={{ color: "#FCA5A5" }}>⏻</Text>
            </Btn>
          </View>
        </View>
      </View>
    </View>
  );
}