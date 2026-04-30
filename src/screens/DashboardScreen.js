import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  ScrollView,
  AppState,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CallLog from "react-native-call-log";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { syncCallLogs, getCallLogKpi, getCallLogs } from "../api/rmo";
import Icon from "../components/Icon";
import PressableScale from "../components/PressableScale";
import FadeSlideIn from "../components/FadeSlideIn";
import SettingsSheet from "../components/SettingsSheet";

const LOGIN_TIME_KEY = "@csr_tracker_login_time";
const SYNC_STATE_KEY = "@csr_tracker_sync_state";

function formatSeconds(sec) {
  const v = Number(sec) || 0;
  if (v <= 0) return "0s";
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  const s = Math.floor(v % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

function formatTime(ts) {
  if (!ts) return "--:--";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRecentDate(ts) {
  if (!ts) return "";
  const d = new Date(parseInt(ts, 10));
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const date = sameDay
    ? "Today"
    : d.toLocaleDateString([], { month: "short", day: "2-digit" });
  const time = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

function utcKey(ts, phoneNumber) {
  const iso = new Date(parseInt(ts, 10)).toISOString();
  const [date, timePart] = iso.split("T");
  const time = timePart.split(".")[0];
  return `${phoneNumber || ""}|${date}|${time}`;
}

function typeIconName(type) {
  const t = (type || "").toUpperCase();
  if (t === "INCOMING") return "phone-in";
  if (t === "OUTGOING") return "phone-out";
  if (t === "MISSED" || t === "REJECTED") return "phone-missed";
  return null;
}

function typeColor(type, colors) {
  const t = (type || "").toUpperCase();
  if (t === "INCOMING") return colors.blue;
  if (t === "OUTGOING") return colors.green;
  if (t === "MISSED" || t === "REJECTED") return colors.red;
  return colors.muted;
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

function HeaderChip({ children, onPress, bg, borderColor }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.88}>
      <View
        className="w-9 h-9 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: borderColor,
        }}
      >
        {children}
      </View>
    </PressableScale>
  );
}

function KpiTile({ label, value, accent, colors }) {
  return (
    <View
      className="rounded-xl p-3.5"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        flex: 1,
        minHeight: 78,
      }}
    >
      <Text
        className="font-bold"
        style={{
          color: colors.textSecondary,
          letterSpacing: 0.4,
          fontSize: 11,
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text
        className="font-bold mt-2"
        style={{
          color: accent || colors.text,
          fontFamily: FONT.mono,
          fontSize: 20,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function CallRow({ log, synced, colors }) {
  const display =
    log.name && log.name.length > 0 ? log.name : log.phoneNumber || "Unknown";
  const meta = formatRecentDate(log.timestamp);
  const tIcon = typeIconName(log.type);
  const tColor = typeColor(log.type, colors);
  return (
    <View className="flex-row items-center py-3">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: colors.glass }}
      >
        <Icon name="user" size={18} color={colors.muted} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[15px] font-semibold"
          style={{ color: colors.text, fontFamily: FONT.mono }}
          numberOfLines={1}
        >
          {display}
        </Text>
        <View className="flex-row items-center mt-0.5">
          {tIcon && (
            <View style={{ marginRight: 4 }}>
              <Icon name={tIcon} size={11} color={tColor} />
            </View>
          )}
          <Text
            className="text-[11px]"
            style={{ color: colors.textSecondary, fontFamily: FONT.mono }}
          >
            {meta.date}
          </Text>
          <Text className="text-[11px] mx-1" style={{ color: colors.muted }}>
            {"•"}
          </Text>
          <Text
            className="text-[11px]"
            style={{ color: colors.textSecondary, fontFamily: FONT.mono }}
          >
            {meta.time}
          </Text>
        </View>
      </View>
      <Text
        className="font-bold italic"
        style={{
          color: synced ? colors.green : colors.amber,
          fontSize: 11,
          fontFamily: FONT.mono,
        }}
      >
        {synced ? "Synced" : "Pending"}
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
  const [syncedKeys, setSyncedKeys] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      // silent
    } finally {
      setLoadingKpi(false);
    }
  }, [userId]);

  const fetchSyncedKeys = useCallback(async () => {
    if (!userId || !loginTime) return;
    try {
      const { data } = await getCallLogs(userId, loginTime);
      const list = data?.data || [];
      setSyncedKeys(
        new Set(
          list.map(
            (r) => `${r.phone_number || ""}|${r.call_date}|${r.call_time}`
          )
        )
      );
    } catch {
      // silent
    }
  }, [userId, loginTime]);

  const loadCallLogs = useCallback(async () => {
    if (!hasPermission || !loginTime) return;
    setLoadingLogs(true);
    try {
      const logs = await CallLog.load(-1, { minTimestamp: loginTime });
      setCallLogs(logs || []);
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to load call logs: " + (err.message || "Unknown error")
      );
    } finally {
      setLoadingLogs(false);
    }
  }, [hasPermission, loginTime]);

  useEffect(() => {
    if (loginTime && hasPermission) loadCallLogs();
  }, [loginTime, hasPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && loginTime && hasPermission) loadCallLogs();
    });
    return () => sub.remove();
  }, [loginTime, hasPermission, loadCallLogs]);

  useEffect(() => {
    fetchKpi();
  }, [fetchKpi]);

  useEffect(() => {
    fetchSyncedKeys();
  }, [fetchSyncedKeys]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchKpi(), loadCallLogs(), fetchSyncedKeys()]);
    setRefreshing(false);
  }, [fetchKpi, loadCallLogs, fetchSyncedKeys]);

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
      // fallback
    }
    setLoadingLogs(false);

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
        timestamp: new Date(parseInt(log.timestamp, 10)).toISOString(),
      }));

      await syncCallLogs(userId, payload);
      const now = Date.now();
      setLastSync(now);
      const newSyncedCount = syncedCount + newLogs.length;
      setSyncedCount(newSyncedCount);
      AsyncStorage.setItem(
        SYNC_STATE_KEY,
        JSON.stringify({ userId, lastSync: now, syncedCount: newSyncedCount })
      );
      Alert.alert("Synced", `${payload.length} new call logs synced.`);
      fetchKpi();
      fetchSyncedKeys();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Sync failed";
      Alert.alert("Sync Error", msg);
    } finally {
      setSyncing(false);
    }
  }, [
    loginTime,
    lastSync,
    syncedCount,
    callLogs,
    userId,
    hasPermission,
    fetchKpi,
    fetchSyncedKeys,
  ]);

  const unsyncedCount = Math.max(0, callLogs.length - syncedCount);
  const hasUnsynced = unsyncedCount > 0;

  const handleLogout = useCallback(() => {
    if (hasUnsynced) {
      Alert.alert(
        "Sync Required",
        "Please sync your call logs before logging out."
      );
      return;
    }
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "@csr_tracker_user",
            LOGIN_TIME_KEY,
            SYNC_STATE_KEY,
          ]);
          navigation.replace("Welcome");
        },
      },
    ]);
  }, [navigation, hasUnsynced]);

  const recentCalls = callLogs.slice(0, 6);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.surface }}
      edges={[]}
    >
      <View style={{ paddingTop: 10 }}>
        {/* Top bar: brand + avatar (avatar opens settings) */}
        <View className="flex-row items-center justify-between px-5 pb-1">
          <Text
            className="text-[22px] font-bold"
            style={{
              color: colors.primary,
              fontFamily: FONT.mono,
              letterSpacing: -0.5,
            }}
          >
            CallSync
          </Text>
          <PressableScale onPress={() => setSettingsOpen(true)} scaleTo={0.9}>
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text
                className="text-[13px] font-bold"
                style={{ color: "#fff", fontFamily: FONT.mono }}
              >
                {agentName?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          </PressableScale>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Welcome */}
        <FadeSlideIn delay={40}>
          <View className="px-5 mt-3">
            <Text
              className="text-[24px] font-bold"
              style={{ color: colors.text, letterSpacing: -0.5 }}
            >
              Welcome back,
            </Text>
            <Text
              className="text-[13px] mt-1"
              style={{ color: colors.textSecondary }}
            >
              Let's review your calls and celebrate your progress
            </Text>
          </View>
        </FadeSlideIn>

        {/* Session card */}
        <FadeSlideIn delay={120}>
          <View className="px-5 mt-4">
            <View
              className="rounded-xl p-4 flex-row items-center"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: colors.glass }}
              >
                <Icon name="phone" size={22} color={colors.text} />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text
                    className="text-[12px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Call Logs in this session
                  </Text>
                  <Text
                    className="text-[13px] font-bold"
                    style={{ color: colors.text, fontFamily: FONT.mono }}
                  >
                    {callLogs.length} items
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mt-1.5">
                  <Text
                    className="text-[12px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Session Started
                  </Text>
                  <Text
                    className="text-[12px]"
                    style={{ color: colors.text, fontFamily: FONT.mono }}
                  >
                    {loginTime ? formatTime(loginTime) : "--:--"}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mt-1">
                  <Text
                    className="text-[12px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Last Sync
                  </Text>
                  <Text
                    className="text-[12px]"
                    style={{
                      color: lastSync ? colors.green : colors.muted,
                      fontFamily: FONT.mono,
                    }}
                  >
                    {lastSync ? formatTime(lastSync) : "Not yet"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </FadeSlideIn>

        {/* Overview */}
        <FadeSlideIn delay={200}>
          <View className="px-5 mt-5">
            <Text
              className="text-[16px] font-bold mb-3"
              style={{ color: colors.text }}
            >
              Overview
            </Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <KpiTile
                label="Total Order Called"
                value={kpi?.total_called ?? 0}
                accent={colors.primary}
                colors={colors}
              />
              <KpiTile
                label="Total Order"
                value={kpi?.total_orders ?? 0}
                accent={colors.blue}
                colors={colors}
              />
            </View>
            <View className="flex-row mt-2.5" style={{ gap: 10 }}>
              <KpiTile
                label="Total Attempts"
                value={kpi?.total_attempts ?? 0}
                accent={colors.amber}
                colors={colors}
              />
              <KpiTile
                label="Total Talk Time"
                value={formatSeconds(
                  kpi?.total_talk_time ?? kpi?.total_time ?? 0
                )}
                accent={colors.text}
                colors={colors}
              />
            </View>
            <View className="flex-row mt-2.5" style={{ gap: 10 }}>
              <KpiTile
                label="Riders"
                value={kpi?.riders_called ?? 0}
                accent={colors.amber}
                colors={colors}
              />
              <KpiTile
                label="Customers"
                value={kpi?.customers_called ?? 0}
                accent={colors.green}
                colors={colors}
              />
            </View>
          </View>
        </FadeSlideIn>

        {/* Recent Call */}
        <FadeSlideIn delay={300}>
          <View className="px-5 mt-5">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className="text-[16px] font-bold"
                style={{ color: colors.text }}
              >
                Recent Call
              </Text>
              <PressableScale
                onPress={() => navigation.navigate("CallLogs")}
                scaleTo={0.9}
                hitSlop={10}
              >
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: colors.primary }}
                >
                  View All
                </Text>
              </PressableScale>
            </View>
            <View
              className="rounded-xl px-3 mt-2"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {recentCalls.length === 0 ? (
                <View className="py-10 items-center">
                  <Text
                    className="text-[12px]"
                    style={{
                      color: colors.muted,
                      fontFamily: FONT.mono,
                      letterSpacing: 0.4,
                    }}
                  >
                    {loadingLogs
                      ? "Loading calls..."
                      : "No calls in this session yet"}
                  </Text>
                </View>
              ) : (
                recentCalls.map((log, idx) => {
                  const k = utcKey(log.timestamp, log.phoneNumber);
                  return (
                    <View
                      key={`${log.timestamp || idx}-${idx}`}
                      style={{
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <CallRow
                        log={log}
                        synced={syncedKeys.has(k)}
                        colors={colors}
                      />
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </FadeSlideIn>
      </ScrollView>

      {/* Bottom Sync Button */}
      <View
        className="px-5"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          backgroundColor: colors.surface,
        }}
      >
        <PressableScale onPress={handleSync} disabled={syncing}>
          <View
            className="rounded-full items-center justify-center"
            style={{
              backgroundColor: syncing ? colors.primaryDim : colors.primary,
              paddingVertical: 16,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: syncing ? 0 : 0.32,
              shadowRadius: 14,
              elevation: syncing ? 0 : 10,
            }}
          >
            {syncing ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#fff" />
                <Text
                  className="text-[15px] font-bold ml-2"
                  style={{
                    color: "#fff",
                    fontFamily: FONT.mono,
                    letterSpacing: 0.4,
                  }}
                >
                  Syncing...
                </Text>
              </View>
            ) : (
              <Text
                className="text-[15px] font-bold"
                style={{
                  color: "#fff",
                  fontFamily: FONT.mono,
                  letterSpacing: 0.4,
                }}
              >
                Sync ({callLogs.length} items)
              </Text>
            )}
          </View>
        </PressableScale>
      </View>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        agentName={agentName}
        mode={mode}
        onToggleTheme={toggle}
        onHelp={() => {
          setSettingsOpen(false);
          navigation.navigate("Help");
        }}
        onLogout={handleLogout}
        hasUnsynced={hasUnsynced}
        colors={colors}
      />
    </SafeAreaView>
  );
}
