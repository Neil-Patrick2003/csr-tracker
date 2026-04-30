import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CallLog from "react-native-call-log";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { getCallLogs } from "../api/rmo";
import Icon from "../components/Icon";
import PressableScale from "../components/PressableScale";
import FadeSlideIn from "../components/FadeSlideIn";

const LOGIN_TIME_KEY = "@csr_tracker_login_time";
const USER_KEY = "@csr_tracker_user";

function formatDuration(sec) {
  const total = parseInt(sec, 10) || 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatRecentDate(ts) {
  if (!ts) return { date: "", time: "" };
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

async function ensureCallLogPermission() {
  if (Platform.OS !== "android") return false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function CallRow({ log, synced, colors, isLast }) {
  const display =
    log.name && log.name.length > 0 ? log.name : log.phoneNumber || "Unknown";
  const meta = formatRecentDate(log.timestamp);
  const tIcon = typeIconName(log.type);
  const tColor = typeColor(log.type, colors);
  return (
    <View
      className="flex-row items-center py-3 px-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: colors.glass }}
      >
        <Icon name="user" size={18} color={colors.muted} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[14px] font-semibold"
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
          <Text className="text-[11px] mx-1" style={{ color: colors.muted }}>
            {"•"}
          </Text>
          <Text
            className="text-[11px]"
            style={{ color: colors.textSecondary, fontFamily: FONT.mono }}
          >
            {formatDuration(log.duration)}
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

function ListHeader({ logs, syncedCount, pendingCount, syncedPct, loading, refreshing, colors }) {
  return (
    <View className="px-5">
      <FadeSlideIn delay={40}>
        <View className="mt-3">
          <Text
            className="text-[22px] font-bold"
            style={{ color: colors.text, letterSpacing: -0.5 }}
          >
            Your calls
          </Text>
          <Text
            className="text-[13px] mt-1"
            style={{ color: colors.textSecondary }}
          >
            Every call from this session and its sync status.
          </Text>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={120}>
        <View
          className="rounded-xl p-4 mt-4"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-end justify-between mb-2.5">
            <View>
              <Text
                className="text-[10px]"
                style={{
                  color: colors.muted,
                  fontFamily: FONT.mono,
                  letterSpacing: 0.7,
                }}
              >
                TOTAL CALLS
              </Text>
              <Text
                className="text-[28px] font-bold mt-0.5"
                style={{
                  color: colors.text,
                  fontFamily: FONT.mono,
                  letterSpacing: -1,
                  lineHeight: 32,
                }}
              >
                {logs.length}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className="text-[10px]"
                style={{
                  color: colors.muted,
                  fontFamily: FONT.mono,
                  letterSpacing: 0.7,
                }}
              >
                SYNCED
              </Text>
              <Text
                className="text-[20px] font-bold mt-0.5"
                style={{
                  color: colors.primary,
                  fontFamily: FONT.mono,
                  letterSpacing: -0.5,
                }}
              >
                {syncedPct}%
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 5,
              backgroundColor: colors.glass,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${syncedPct}%`,
                backgroundColor: colors.primary,
                borderRadius: 3,
              }}
            />
          </View>
          <View className="flex-row items-center mt-3">
            <View
              className="w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: colors.green }}
            />
            <Text
              className="text-[11px] font-bold"
              style={{ color: colors.text, fontFamily: FONT.mono }}
            >
              {syncedCount} synced
            </Text>
            <View
              className="w-2 h-2 rounded-full ml-3 mr-1.5"
              style={{ backgroundColor: colors.amber }}
            />
            <Text
              className="text-[11px] font-bold"
              style={{ color: colors.text, fontFamily: FONT.mono }}
            >
              {pendingCount} pending
            </Text>
            {(loading || refreshing) && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginLeft: "auto" }}
              />
            )}
          </View>
        </View>
      </FadeSlideIn>

      <Text
        className="text-[12px] font-bold mt-5 mb-2"
        style={{
          color: colors.textSecondary,
          letterSpacing: 0.6,
          fontFamily: FONT.mono,
        }}
      >
        ALL CALLS
      </Text>
    </View>
  );
}

export default function CallLogsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [logs, setLogs] = useState([]);
  const [syncedKeys, setSyncedKeys] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async (mode = "load") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [userRaw, loginRaw] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(LOGIN_TIME_KEY),
      ]);
      const user = userRaw ? JSON.parse(userRaw) : null;
      const login = loginRaw ? JSON.parse(loginRaw) : null;
      const uid = user?.userId;
      const lt =
        login && login.userId === uid && login.time ? login.time : null;

      if (!uid || !lt) {
        setLogs([]);
        setSyncedKeys(new Set());
        return;
      }

      const granted = await ensureCallLogPermission();
      if (!granted) {
        setError("Call log permission not granted.");
        setLogs([]);
        setSyncedKeys(new Set());
        return;
      }

      const [localLogs, serverRes] = await Promise.all([
        CallLog.load(-1, { minTimestamp: lt }).catch(() => []),
        getCallLogs(uid, lt).catch(() => ({ data: { data: [] } })),
      ]);

      const serverList = serverRes?.data?.data || [];
      const keys = new Set(
        serverList.map(
          (r) => `${r.phone_number || ""}|${r.call_date}|${r.call_time}`
        )
      );

      setLogs(localLogs || []);
      setSyncedKeys(keys);
    } catch (err) {
      setError(err?.message || "Failed to load call logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll("load");
    }, [loadAll])
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const key = utcKey(item.timestamp, item.phoneNumber);
      return (
        <View className="px-5">
          <View
            style={{
              backgroundColor: colors.card,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: colors.border,
              borderTopWidth: index === 0 ? 1 : 0,
              borderBottomWidth: index === logs.length - 1 ? 1 : 0,
              borderTopLeftRadius: index === 0 ? 12 : 0,
              borderTopRightRadius: index === 0 ? 12 : 0,
              borderBottomLeftRadius: index === logs.length - 1 ? 12 : 0,
              borderBottomRightRadius: index === logs.length - 1 ? 12 : 0,
            }}
          >
            <CallRow
              log={item}
              synced={syncedKeys.has(key)}
              colors={colors}
              isLast={index === logs.length - 1}
            />
          </View>
        </View>
      );
    },
    [syncedKeys, colors, logs.length]
  );

  const keyExtractor = useCallback(
    (item, index) =>
      `${item.timestamp || index}-${item.phoneNumber || ""}-${index}`,
    []
  );

  const syncedCount = logs.reduce(
    (acc, log) =>
      acc + (syncedKeys.has(utcKey(log.timestamp, log.phoneNumber)) ? 1 : 0),
    0
  );
  const pendingCount = logs.length - syncedCount;
  const syncedPct =
    logs.length > 0 ? Math.round((syncedCount / logs.length) * 100) : 0;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.surface }}
      edges={[]}
    >
      <View style={{ paddingTop: 10 }}>
        <View className="flex-row items-center justify-between px-5 pb-1">
          <View className="flex-row items-center">
            <PressableScale onPress={() => navigation.goBack()} scaleTo={0.88}>
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Icon name="arrow-left" size={15} color={colors.text} />
              </View>
            </PressableScale>
            <Text
              className="text-[18px] font-bold"
              style={{ color: colors.text, letterSpacing: -0.3 }}
            >
              Call Logs
            </Text>
          </View>
          <PressableScale onPress={() => loadAll("refresh")} scaleTo={0.88}>
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Icon name="refresh" size={15} color={colors.text} />
            </View>
          </PressableScale>
        </View>
      </View>

      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <ListHeader
            logs={logs}
            syncedCount={syncedCount}
            pendingCount={pendingCount}
            syncedPct={syncedPct}
            loading={loading}
            refreshing={refreshing}
            colors={colors}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAll("refresh")}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator color={colors.primary} />
              <Text
                className="text-[11px] mt-3"
                style={{
                  color: colors.muted,
                  fontFamily: FONT.mono,
                  letterSpacing: 0.5,
                }}
              >
                LOADING CALLS...
              </Text>
            </View>
          ) : (
            <View className="px-5 items-center py-12">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: colors.primary + "15" }}
              >
                <Icon name="phone" size={22} color={colors.primary} />
              </View>
              <Text
                className="text-[14px] font-bold mb-1"
                style={{ color: colors.text }}
              >
                {error ? "Could not load logs" : "No calls yet"}
              </Text>
              <Text
                className="text-[11px] px-8 text-center"
                style={{
                  color: colors.muted,
                  fontFamily: FONT.mono,
                  letterSpacing: 0.3,
                  lineHeight: 16,
                }}
              >
                {error
                  ? error
                  : "Calls made during this session will appear here."}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
