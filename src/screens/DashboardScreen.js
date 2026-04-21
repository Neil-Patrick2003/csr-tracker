import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  ScrollView,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CallLog from "react-native-call-log";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { syncCallLogs, getCallLogKpi } from "../api/rmo";

const LOGIN_TIME_KEY = "@csr_tracker_login_time";
const SYNC_STATE_KEY = "@csr_tracker_sync_state";

function formatSeconds(sec) {
  if (!sec || sec <= 0) return "0s";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

function formatTime(ts) {
  if (!ts) return "--:--";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFullTime(ts) {
  if (!ts) return "--:--:--";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function requestCallLogPermission() {
  if (Platform.OS !== "android") return false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      {
        title: "Call Log Permission",
        message: "This app needs access to your call log to track calls.",
        buttonPositive: "Allow",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function KpiCard({ value, label, color, colors, accent }) {
  return (
    <View
      className="flex-1 rounded-2xl p-4 mx-1.5"
      style={{
        backgroundColor: accent ? accent + "10" : colors.card,
        borderWidth: 1,
        borderColor: accent ? accent + "25" : colors.border,
      }}
    >
      <Text
        className="font-bold mb-2"
        style={{ color: colors.muted, letterSpacing: 0.6, fontSize: 8, textTransform: "uppercase" }}
      >
        {label}
      </Text>
      <Text
        className="font-bold"
        style={{ color, fontFamily: FONT.mono, fontSize: 26, lineHeight: 30 }}
      >
        {value}
      </Text>
    </View>
  );
}

function SmallKpiCard({ value, label, color, colors }) {
  return (
    <View
      className="flex-1 rounded-xl p-3 mx-1"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <Text
        className="font-bold mb-1.5"
        style={{ color: colors.muted, letterSpacing: 0.6, fontSize: 7, textTransform: "uppercase" }}
      >
        {label}
      </Text>
      <Text className="font-bold" style={{ color, fontFamily: FONT.mono, fontSize: 16, lineHeight: 20 }}>
        {value}
      </Text>
    </View>
  );
}

export default function DashboardScreen({ route }) {
  const { colors, mode, toggle } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const agentName = route?.params?.agentName || "Agent";
  const userId = route?.params?.userId;

  const [hasPermission, setHasPermission] = useState(false);
  const [loginTime, setLoginTime] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingKpi, setLoadingKpi] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncedCount, setSyncedCount] = useState(0);
  const [kpi, setKpi] = useState(null);

  useEffect(() => {
    requestCallLogPermission().then(setHasPermission);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LOGIN_TIME_KEY).then((val) => {
      if (val) {
        const saved = JSON.parse(val);
        if (saved.userId === userId) {
          setLoginTime(saved.time);
          return;
        }
      }
      const now = Date.now();
      setLoginTime(now);
      AsyncStorage.setItem(LOGIN_TIME_KEY, JSON.stringify({ userId, time: now }));
    });
  }, [userId]);

  // Restore sync state from storage
  useEffect(() => {
    AsyncStorage.getItem(SYNC_STATE_KEY).then((val) => {
      if (val) {
        const saved = JSON.parse(val);
        if (saved.userId === userId) {
          setLastSync(saved.lastSync);
          setSyncedCount(saved.syncedCount);
        }
      }
    });
  }, [userId]);

  const fetchKpi = useCallback(async () => {
    if (!userId) return;
    setLoadingKpi(true);
    try {
      const { data } = await getCallLogKpi(userId);
      setKpi(data);
    } catch {
      // Silently fail
    } finally {
      setLoadingKpi(false);
    }
  }, [userId]);

  const loadCallLogs = useCallback(async () => {
    if (!hasPermission || !loginTime) return;
    setLoadingLogs(true);
    try {
      const logs = await CallLog.load(-1, { minTimestamp: loginTime });
      setCallLogs(logs || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load call logs: " + (err.message || "Unknown error"));
    } finally {
      setLoadingLogs(false);
    }
  }, [hasPermission, loginTime]);

  useEffect(() => {
    if (loginTime && hasPermission) loadCallLogs();
  }, [loginTime, hasPermission]);

  // Reload call logs when app returns to foreground (e.g. after a phone call)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && loginTime && hasPermission) {
        loadCallLogs();
      }
    });
    return () => sub.remove();
  }, [loginTime, hasPermission, loadCallLogs]);

  useEffect(() => {
    fetchKpi();
  }, [fetchKpi]);

  const handleSync = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert("Permission Required", "Call log permission is needed.");
      return;
    }

    setLoadingLogs(true);
    let allLogs = callLogs;
    try {
      const logs = await CallLog.load(-1, { minTimestamp: loginTime });
      allLogs = logs || [];
      setCallLogs(allLogs);
    } catch {
      // fallback to existing
    }
    setLoadingLogs(false);

    // Only sync logs that came after the last sync
    const sinceTime = lastSync || loginTime;
    const newLogs = allLogs.filter((log) => {
      const logTime = log.timestamp ? parseInt(log.timestamp, 10) : 0;
      return logTime > sinceTime;
    });

    if (newLogs.length === 0) {
      Alert.alert("Nothing to Sync", "No new call logs to sync.");
      return;
    }

    setSyncing(true);
    try {
      const payload = newLogs.map((log) => ({
        phone_number: log.phoneNumber || "",
        type: log.type || "UNKNOWN",
        duration: parseInt(log.duration, 10) || 0,
        timestamp: log.dateTime || new Date(parseInt(log.timestamp, 10)).toISOString(),
      }));

      await syncCallLogs(userId, payload);
      const now = Date.now();
      setLastSync(now);
      const newSyncedCount = syncedCount + newLogs.length;
      setSyncedCount(newSyncedCount);
      AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify({
        userId,
        lastSync: now,
        syncedCount: newSyncedCount,
      }));
      Alert.alert("Synced", `${payload.length} new call logs synced.`);
      fetchKpi();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Sync failed";
      Alert.alert("Sync Error", msg);
    } finally {
      setSyncing(false);
    }
  }, [loginTime, lastSync, syncedCount, callLogs, userId, hasPermission, fetchKpi]);

  const unsyncedCount = callLogs.length - syncedCount;
  const hasUnsynced = unsyncedCount > 0;

  const handleLogout = useCallback(() => {
    if (hasUnsynced) {
      Alert.alert("Sync Required", "Please sync your call logs before logging out.");
      return;
    }
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["@csr_tracker_user", LOGIN_TIME_KEY, SYNC_STATE_KEY]);
          navigation.replace("Setup");
        },
      },
    ]);
  }, [navigation, hasUnsynced]);

  const loading = loadingLogs || loadingKpi;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.ink }} edges={[]}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <View className="px-5 pt-3 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-[20px] font-bold"
              style={{ color: "#fff", fontFamily: FONT.mono, letterSpacing: -0.5 }}
            >
              Call Logs
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                onPress={() => { fetchKpi(); loadCallLogs(); }}
                activeOpacity={0.6}
              >
                <Text className="text-[14px]" style={{ color: "#fff" }}>{"\u21BB"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                onPress={toggle}
                activeOpacity={0.6}
              >
                <Text className="text-[13px]" style={{ color: "#fff" }}>
                  {mode === "dark" ? "\u2600\uFE0E" : "\u263E"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: hasUnsynced ? "rgba(255,255,255,0.08)" : "rgba(239,68,68,0.3)",
                  opacity: hasUnsynced ? 0.4 : 1,
                }}
                onPress={handleLogout}
                activeOpacity={0.6}
              >
                <Text className="text-[12px]" style={{ color: hasUnsynced ? "rgba(255,255,255,0.4)" : "#FCA5A5" }}>{"\u23FB"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Agent info bar */}
          <View
            className="flex-row items-center rounded-xl px-3.5 py-2.5"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Text className="text-[12px] font-bold" style={{ color: "#fff" }}>
                {agentName?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-[13px] font-bold"
                style={{ color: "#fff", fontFamily: FONT.mono }}
                numberOfLines={1}
              >
                {agentName}
              </Text>
              <Text
                className="text-[9px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONT.mono }}
              >
                Session started {loginTime ? formatTime(loginTime) : "--:--"}
              </Text>
            </View>
            {loading && <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />}
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main KPIs */}
        <Text
          className="font-bold mb-3 ml-1"
          style={{ color: colors.textSecondary, letterSpacing: 1, fontSize: 10 }}
        >
          OVERVIEW
        </Text>
        <View className="flex-row mb-3">
          <KpiCard
            value={kpi?.total_called ?? 0}
            label="Total Called"
            color={colors.primary}
            colors={colors}
            accent={colors.primary}
          />
          <KpiCard
            value={kpi?.total_orders ?? 0}
            label="Total Orders"
            color={colors.blue}
            colors={colors}
            accent={colors.blue}
          />
          <KpiCard
            value={kpi?.total_attempts ?? 0}
            label="Attempts"
            color={colors.amber}
            colors={colors}
            accent={colors.amber}
          />
        </View>

        {/* Secondary KPIs */}
        <Text
          className="font-bold mb-3 mt-3 ml-1"
          style={{ color: colors.textSecondary, letterSpacing: 1, fontSize: 10 }}
        >
          BREAKDOWN
        </Text>
        <View className="flex-row mb-3">
          <SmallKpiCard
            value={kpi?.customers_called ?? 0}
            label="Customers"
            color={colors.green}
            colors={colors}
          />
          <SmallKpiCard
            value={kpi?.riders_called ?? 0}
            label="Riders"
            color={colors.amber}
            colors={colors}
          />
          <SmallKpiCard
            value={formatSeconds(kpi?.total_talk_time ?? kpi?.total_time ?? 0)}
            label="Talk Time"
            color={colors.blue}
            colors={colors}
          />
        </View>

        {/* Device status card */}
        <View
          className="rounded-2xl p-4 mt-3 mx-0.5"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Text
            className="font-bold mb-3"
            style={{ color: colors.textSecondary, letterSpacing: 1, fontSize: 9 }}
          >
            DEVICE STATUS
          </Text>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[12px]" style={{ color: colors.muted }}>Call logs in this device (current session)</Text>
            <Text className="text-[13px] font-bold" style={{ color: colors.text, fontFamily: FONT.mono }}>
              {callLogs.length}
            </Text>
          </View>
          <View
            className="mb-2"
            style={{ height: 1, backgroundColor: colors.border }}
          />
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[12px]" style={{ color: colors.muted }}>Session started</Text>
            <Text className="text-[13px] font-bold" style={{ color: colors.text, fontFamily: FONT.mono }}>
              {loginTime ? formatFullTime(loginTime) : "--:--:--"}
            </Text>
          </View>
          <View
            className="mb-2"
            style={{ height: 1, backgroundColor: colors.border }}
          />
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px]" style={{ color: colors.muted }}>Last synced</Text>
            <Text className="text-[13px] font-bold" style={{ color: lastSync ? colors.green : colors.muted, fontFamily: FONT.mono }}>
              {lastSync ? formatFullTime(lastSync) : "Not yet"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sync Button */}
      <View
        className="px-5 pt-3"
        style={{
          backgroundColor: colors.ink,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <TouchableOpacity
          className="rounded-2xl py-4.5 items-center"
          style={{
            backgroundColor: syncing ? colors.primaryDim : colors.primary,
            opacity: syncing ? 0.8 : 1,
            paddingVertical: 18,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: syncing ? 0 : 0.3,
            shadowRadius: 12,
            elevation: syncing ? 0 : 8,
          }}
          onPress={handleSync}
          disabled={syncing}
          activeOpacity={0.7}
        >
          {syncing ? (
            <View className="flex-row items-center gap-2.5">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-[15px] font-bold" style={{ color: "#fff", fontFamily: FONT.mono }}>
                Syncing...
              </Text>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-[15px] font-bold" style={{ color: "#fff", fontFamily: FONT.mono }}>
                {"\u21C5"}  Sync Call Logs
              </Text>
              {unsyncedCount > 0 && (
                <Text className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.6)", fontFamily: FONT.mono }}>
                  {unsyncedCount} unsynced logs
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
