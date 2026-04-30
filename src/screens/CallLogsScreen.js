import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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

const LOGIN_TIME_KEY = "@csr_tracker_login_time";
const USER_KEY = "@csr_tracker_user";

function formatDuration(sec) {
  const total = parseInt(sec, 10) || 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatLocalTime(ts) {
  if (!ts) return "--:--";
  const d = new Date(parseInt(ts, 10));
  return d.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function utcKey(ts, phoneNumber) {
  const iso = new Date(parseInt(ts, 10)).toISOString();
  const [date, timePart] = iso.split("T");
  const time = timePart.split(".")[0];
  return `${phoneNumber || ""}|${date}|${time}`;
}

function typeMeta(type, colors) {
  const t = (type || "").toUpperCase();
  if (t === "INCOMING") return { icon: "↙", color: colors.blue, label: "In" };
  if (t === "OUTGOING") return { icon: "↗", color: colors.green, label: "Out" };
  if (t === "MISSED") return { icon: "✕", color: colors.red, label: "Missed" };
  if (t === "REJECTED") return { icon: "⃠", color: colors.red, label: "Rejected" };
  return { icon: "•", color: colors.muted, label: t || "Unknown" };
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

function Badge({ synced, colors }) {
  const bg = synced ? colors.greenDim : colors.amberDim;
  const border = synced ? colors.greenBorder : colors.amberBorder;
  const fg = synced ? colors.green : colors.amber;
  return (
    <View
      className="px-2 py-1 rounded-full"
      style={{ backgroundColor: bg, borderWidth: 1, borderColor: border }}
    >
      <Text
        className="font-bold"
        style={{ color: fg, fontFamily: FONT.mono, fontSize: 9, letterSpacing: 0.5 }}
      >
        {synced ? "SYNCED" : "PENDING"}
      </Text>
    </View>
  );
}

function LogRow({ log, synced, colors }) {
  const meta = typeMeta(log.type, colors);
  const display = log.name && log.name.length > 0 ? log.name : log.phoneNumber || "Unknown";
  return (
    <View
      className="flex-row items-center rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: meta.color + "18" }}
      >
        <Text style={{ color: meta.color, fontSize: 16, fontFamily: FONT.mono }}>
          {meta.icon}
        </Text>
      </View>
      <View className="flex-1 mr-2">
        <Text
          className="text-[13px] font-bold"
          style={{ color: colors.text, fontFamily: FONT.mono }}
          numberOfLines={1}
        >
          {display}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text
            className="text-[10px]"
            style={{ color: colors.textSecondary, fontFamily: FONT.mono }}
          >
            {meta.label}
          </Text>
          <Text className="text-[10px] mx-1.5" style={{ color: colors.muted }}>
            {"•"}
          </Text>
          <Text
            className="text-[10px]"
            style={{ color: colors.textSecondary, fontFamily: FONT.mono }}
          >
            {formatDuration(log.duration)}
          </Text>
          <Text className="text-[10px] mx-1.5" style={{ color: colors.muted }}>
            {"•"}
          </Text>
          <Text
            className="text-[10px]"
            style={{ color: colors.muted, fontFamily: FONT.mono }}
            numberOfLines={1}
          >
            {formatLocalTime(log.timestamp)}
          </Text>
        </View>
      </View>
      <Badge synced={synced} colors={colors} />
    </View>
  );
}

export default function CallLogsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState(null);
  const [loginTime, setLoginTime] = useState(null);
  const [logs, setLogs] = useState([]);
  const [syncedKeys, setSyncedKeys] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = useCallback(
    async (mode = "load") => {
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

        setUserId(uid);
        setLoginTime(lt);

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
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadAll("load");
    }, [loadAll])
  );

  const renderItem = useCallback(
    ({ item }) => {
      const key = utcKey(item.timestamp, item.phoneNumber);
      return <LogRow log={item} synced={syncedKeys.has(key)} colors={colors} />;
    },
    [syncedKeys, colors]
  );

  const keyExtractor = useCallback(
    (item, index) => `${item.timestamp || index}-${item.phoneNumber || ""}-${index}`,
    []
  );

  const syncedCount = logs.reduce((acc, log) => {
    return acc + (syncedKeys.has(utcKey(log.timestamp, log.phoneNumber)) ? 1 : 0);
  }, 0);
  const pendingCount = logs.length - syncedCount;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.ink }} edges={[]}>
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
            <View className="flex-row items-center">
              <TouchableOpacity
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                onPress={() => navigation.goBack()}
                activeOpacity={0.6}
              >
                <Text className="text-[16px]" style={{ color: "#fff" }}>{"←"}</Text>
              </TouchableOpacity>
              <Text
                className="text-[20px] font-bold"
                style={{ color: "#fff", fontFamily: FONT.mono, letterSpacing: -0.5 }}
              >
                Call Logs
              </Text>
            </View>
            <TouchableOpacity
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              onPress={() => loadAll("refresh")}
              activeOpacity={0.6}
            >
              <Text className="text-[14px]" style={{ color: "#fff" }}>{"↻"}</Text>
            </TouchableOpacity>
          </View>

          <View
            className="flex-row items-center rounded-xl px-3.5 py-2.5"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <View className="flex-1 flex-row items-center">
              <Text
                className="text-[11px] font-bold"
                style={{ color: "#fff", fontFamily: FONT.mono }}
              >
                {logs.length} total
              </Text>
              <Text className="text-[11px] mx-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                {"•"}
              </Text>
              <Text
                className="text-[11px] font-bold"
                style={{ color: "#fff", fontFamily: FONT.mono }}
              >
                {syncedCount} synced
              </Text>
              <Text className="text-[11px] mx-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                {"•"}
              </Text>
              <Text
                className="text-[11px] font-bold"
                style={{ color: "#fff", fontFamily: FONT.mono }}
              >
                {pendingCount} pending
              </Text>
            </View>
            {(loading || refreshing) && (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            )}
          </View>
        </View>
      </View>

      {loading && logs.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            padding: 16,
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
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text
                className="text-[13px] mb-1"
                style={{ color: colors.textSecondary, fontFamily: FONT.mono }}
              >
                {error ? "Could not load logs" : "No calls in this session yet"}
              </Text>
              {error && (
                <Text
                  className="text-[10px] px-8 text-center"
                  style={{ color: colors.muted, fontFamily: FONT.mono }}
                >
                  {error}
                </Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
