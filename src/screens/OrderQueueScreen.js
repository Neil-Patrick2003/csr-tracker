import { useState, useEffect, useRef, useCallback } from "react";
import { View, FlatList, Linking, Alert, ActivityIndicator, Text, TouchableOpacity, AppState, PermissionsAndroid, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import CallLog from "react-native-call-log";
import Header from "../components/Header";
import SummaryStrip from "../components/SummaryStrip";
import OrderCard from "../components/OrderCard";
import CallLogsModal from "../components/CallLogsModal";
import FilterBar from "../components/FilterBar";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { getAssignedOrders, syncCallTracking } from "../api/rmo";

function mapApiOrder(raw, index) {
  return {
    id: `${raw.order_id}-${raw.order_number}-${index}`,
    rawId: raw.order_id,
    orderId: raw.order_number,
    name: raw.customer_name,
    phone: raw.phone_number || "",
    address: raw.address || "",
    riderName: raw.rider_name || "",
    riderPhone: raw.rider_phone || "",
    items: raw.items || [],
    pageId: raw.page_id || null,
    pageName: raw.page_name || null,
    shopId: raw.shop_id || null,
    shopName: raw.shop_name || null,
    status: (raw.status || "PENDING").toLowerCase(),
    rawStatus: raw.status || "PENDING",
    // Customer call stats
    attempts: 0,
    talkTime: null,
    totalDurationSec: 0,
    lastCall: null,
    lastCallTimestamp: null,
    callLogs: [],
    // Rider call stats
    riderAttempts: 0,
    riderTalkTime: null,
    riderTotalDurationSec: 0,
    riderLastCall: null,
    riderLastCallTimestamp: null,
    riderCallLogs: [],
  };
}

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

async function requestCallLogPermission() {
  if (Platform.OS !== "android") return false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      {
        title: "Call Log Permission",
        message: "This app needs access to your call log to track delivery calls.",
        buttonPositive: "Allow",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function cleanPhone(phone) {
  return (phone || "").replace(/\s/g, "").replace(/^\+/, "");
}

function phonesMatch(a, b) {
  const ca = cleanPhone(a);
  const cb = cleanPhone(b);
  if (!ca || !cb) return false;
  return ca.endsWith(cb) || cb.endsWith(ca);
}

// Look up the most recent call to this phone number since the given timestamp
async function getCallResult(phoneNumber, callStartTime) {
  try {
    const logs = await CallLog.load(5, { minTimestamp: callStartTime });
    const match = logs.find((log) => phonesMatch(log.phoneNumber, phoneNumber));

    if (!match) return null;

    const answered = match.type === "OUTGOING" || match.duration > 0;
    return {
      duration: parseInt(match.duration, 10) || 0,
      answered,
    };
  } catch {
    return null;
  }
}

// Scan call log for all calls to a phone number today
async function getCallHistoryForPhone(phoneNumber) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const logs = await CallLog.load(100, { minTimestamp: todayStart.getTime() });
    const matches = logs.filter((log) => phonesMatch(log.phoneNumber, phoneNumber));

    if (matches.length === 0) return null;

    const attempts = matches.length;
    const totalDuration = matches.reduce((sum, log) => sum + (parseInt(log.duration, 10) || 0), 0);
    const answered = matches.some((log) => (parseInt(log.duration, 10) || 0) > 0);
    const lastMatch = matches[0];
    const ts = parseInt(lastMatch.timestamp, 10);
    const lastCallTime = ts
      ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;

    // Build individual log entries for the "View Logs" modal
    const callLogs = matches.map((log, index) => {
      const dur = parseInt(log.duration, 10) || 0;
      const logTs = parseInt(log.timestamp, 10);
      const wasAnswered = dur > 0;
      return {
        id: index,
        time: logTs
          ? new Date(logTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          : "—",
        timestamp: logTs || null,
        duration: dur > 0 ? formatSeconds(dur) : "—",
        rawDuration: dur,
        status: wasAnswered ? "answered" : "missed",
      };
    });

    return {
      attempts,
      talkTime: totalDuration > 0 ? formatSeconds(totalDuration) : null,
      totalDurationSec: totalDuration,
      lastCall: lastCallTime,
      lastCallTimestamp: ts || null,
      status: answered ? "answered" : "missed",
      callLogs,
    };
  } catch {
    return null;
  }
}

export default function OrderQueueScreen({ route }) {
  const { colors, toggle } = useTheme();
  const navigation = useNavigation();
  const agentName = route?.params?.agentName || "Agent";
  const userId = route?.params?.userId;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [filters, setFilters] = useState({});
  const [pendingCallOrderId, setPendingCallOrderId] = useState(null);
  const [logsModal, setLogsModal] = useState({ visible: false, order: null, target: "customer" });
  const [syncStatus, setSyncStatus] = useState(null); // null | "syncing" | "success"
  const [lastSync, setLastSync] = useState(null);
  const [hasCallLogPermission, setHasCallLogPermission] = useState(false);
  const callStartTimeRef = useRef(null);
  const callPhoneRef = useRef(null);
  const callTargetRef = useRef(null); // "customer" or "rider"
  const appState = useRef(AppState.currentState);

  // Request call log permission on mount
  useEffect(() => {
    requestCallLogPermission().then(setHasCallLogPermission);
  }, []);

  // Listen for app returning to foreground after a call
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        pendingCallOrderId &&
        callStartTimeRef.current
      ) {
        // Give the call log a moment to update
        setTimeout(async () => {
          if (hasCallLogPermission && callPhoneRef.current) {
            const history = await getCallHistoryForPhone(callPhoneRef.current);
            if (history) {
              const isRider = callTargetRef.current === "rider";
              setOrders((prev) =>
                prev.map((o) => {
                  if (o.id !== pendingCallOrderId) return o;
                  if (isRider) {
                    return {
                      ...o,
                      riderAttempts: history.attempts,
                      riderTalkTime: history.talkTime,
                      riderTotalDurationSec: history.totalDurationSec,
                      riderLastCall: history.lastCall,
                      riderLastCallTimestamp: history.lastCallTimestamp,
                      riderCallLogs: history.callLogs,
                    };
                  }
                  return {
                    ...o,
                    attempts: history.attempts,
                    talkTime: history.talkTime,
                    totalDurationSec: history.totalDurationSec,
                    lastCall: history.lastCall,
                    lastCallTimestamp: history.lastCallTimestamp,
                    callLogs: history.callLogs,
                    status: history.status,
                  };
                })
              );
            }
          }
          setPendingCallOrderId(null);
          callStartTimeRef.current = null;
          callPhoneRef.current = null;
          callTargetRef.current = null;
        }, 2000);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [pendingCallOrderId, hasCallLogPermission]);

  const fetchOrders = useCallback(async (targetPage = page) => {
    if (!userId) return;
    setLoading(true);
    try {

      const { data } = await getAssignedOrders(userId, filters, targetPage, perPage);
      const mapped = (data.data || []).map(mapApiOrder);

      // Update pagination info from flat Laravel response
      setPage(data.current_page || targetPage);
      setLastPage(data.last_page || 1);
      setTotalOrders(data.total || mapped.length);

      // Hydrate each order with call log history for both customer and rider
      if (hasCallLogPermission) {
        const hydrated = await Promise.all(
          mapped.map(async (order) => {
            const custHistory = await getCallHistoryForPhone(order.phone);
            const riderHistory = order.riderPhone
              ? await getCallHistoryForPhone(order.riderPhone)
              : null;

            const custAnswered = custHistory?.status === "answered";
            const custMissed = custHistory && !custAnswered;

            return {
              ...order,
              attempts: custHistory?.attempts || 0,
              talkTime: custHistory?.talkTime || null,
              totalDurationSec: custHistory?.totalDurationSec || 0,
              lastCall: custHistory?.lastCall || null,
              lastCallTimestamp: custHistory?.lastCallTimestamp || null,
              callLogs: custHistory?.callLogs || [],
              status: custAnswered ? "answered" : custMissed ? "missed" : order.status,
              riderAttempts: riderHistory?.attempts || 0,
              riderTalkTime: riderHistory?.talkTime || null,
              riderTotalDurationSec: riderHistory?.totalDurationSec || 0,
              riderLastCall: riderHistory?.lastCall || null,
              riderLastCallTimestamp: riderHistory?.lastCallTimestamp || null,
              riderCallLogs: riderHistory?.callLogs || [],
            };
          })
        );
        setOrders(hydrated);
      } else {
        setOrders(mapped);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load orders";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [userId, hasCallLogPermission, page, perPage, filters]);

  useEffect(() => {
    fetchOrders(1);
  }, [userId, hasCallLogPermission, filters, perPage]);

  const handleCall = useCallback(
    (order) => {
      if (pendingCallOrderId) {
        Alert.alert("Call in Progress", "Please wait for the current call to finish.");
        return;
      }

      const phoneNumber = order.phone.replace(/\s/g, "");
      callStartTimeRef.current = Date.now();
      callPhoneRef.current = phoneNumber;
      callTargetRef.current = "customer";
      setPendingCallOrderId(order.id);

      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        setPendingCallOrderId(null);
        callStartTimeRef.current = null;
        callPhoneRef.current = null;
        callTargetRef.current = null;
      });
    },
    [pendingCallOrderId]
  );

  const handleCallRider = useCallback(
    (order) => {
      if (pendingCallOrderId) {
        Alert.alert("Call in Progress", "Please wait for the current call to finish.");
        return;
      }

      const phoneNumber = order.riderPhone.replace(/\s/g, "");
      callStartTimeRef.current = Date.now();
      callPhoneRef.current = phoneNumber;
      callTargetRef.current = "rider";
      setPendingCallOrderId(order.id);

      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        setPendingCallOrderId(null);
        callStartTimeRef.current = null;
        callPhoneRef.current = null;
        callTargetRef.current = null;
      });
    },
    [pendingCallOrderId]
  );

  const handleLogout = useCallback(() => {
    if (pendingCallOrderId) {
      Alert.alert("Call in Progress", "Please wait for the current call to finish before logging out.");
      return;
    }
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? Unsynced call logs will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => navigation.replace("Setup") },
      ]
    );
  }, [pendingCallOrderId, navigation]);

  const handleSyncAll = useCallback(async () => {
    const formatTimestamp = (ts) => {
      if (!ts) return null;
      const d = new Date(ts);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    // Filter orders that have call data
    const ordersToSync = orders.filter(
      (o) => (o.attempts || 0) > 0 || (o.riderAttempts || 0) > 0
    );

    if (ordersToSync.length === 0) {
      Alert.alert("Nothing to Sync", "No call logs to sync. Make some calls first.");
      return;
    }

    setSyncStatus("syncing");

    try {
      const payload = ordersToSync.map((order) => {
        const item = { order_id: order.rawId };
        if ((order.attempts || 0) > 0) {
          item.customer_call_attempts = order.attempts;
          item.customer_call_duration = order.totalDurationSec || 0;
          item.customer_last_call = formatTimestamp(order.lastCallTimestamp);
        }
        if ((order.riderAttempts || 0) > 0) {
          item.rider_call_attempts = order.riderAttempts;
          item.rider_call_duration = order.riderTotalDurationSec || 0;
          item.rider_last_call = formatTimestamp(order.riderLastCallTimestamp);
        }
        return item;
      });

      const { data } = await syncCallTracking(payload);
      const notFound = data.not_found || [];

      setLastSync({
        time: Date.now(),
        count: data.updated || payload.length,
        notFound,
      });

      setSyncStatus("success");
      setTimeout(() => setSyncStatus(null), 3000);

      if (notFound.length > 0) {
        Alert.alert("Partial Sync", `${data.updated} updated. ${notFound.length} not found.`);
      }
    } catch (err) {
      setSyncStatus(null);
      const msg = err.response?.data?.message || err.message || "Sync failed";
      Alert.alert("Sync Error", msg);
    }
  }, [orders]);

  const headerSubtitle = pendingCallOrderId
    ? `${agentName} · Call in progress...`
    : `${agentName} · ${totalOrders} orders · Page ${page}/${lastPage}`;

  const renderItem = useCallback(
    ({ item }) => {
      const isPending = item.id === pendingCallOrderId;
      const dimmed = pendingCallOrderId && !isPending;
      return (
        <OrderCard
          order={item}
          isActive={isPending}
          onCallCustomer={() => handleCall(item)}
          onCallRider={() => handleCallRider(item)}
          onViewCustomerLogs={(o) => setLogsModal({ visible: true, order: o, target: "customer" })}
          onViewRiderLogs={(o) => setLogsModal({ visible: true, order: o, target: "rider" })}
          dimmed={dimmed}
        />
      );
    },
    [pendingCallOrderId, handleCall, handleCallRider]
  );

  // Sort: pending call first, then not_called, then missed, then answered
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.id === pendingCallOrderId) return -1;
    if (b.id === pendingCallOrderId) return 1;
    const priority = { pending: 0, not_called: 0, missed: 1, answered: 2, delivered: 3 };
    return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
  });

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.ink }} edges={[]}>
      <Header
        agentName={agentName}
        subtitle={headerSubtitle}
        onRefresh={() => fetchOrders(page)}
        onLogout={handleLogout}
        onSyncAll={handleSyncAll}
        syncStatus={syncStatus}
        lastSync={lastSync}
        onToggleTheme={toggle}
      />
      <SummaryStrip orders={orders} totalOrders={totalOrders} />
      <FilterBar filters={filters} onFiltersChange={setFilters} userId={userId} orders={orders} />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="text-[11px] mt-2" style={{ color: colors.muted }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
              <Text className="text-[28px] mb-2" style={{ opacity: 0.4 }}>📭</Text>
              <Text className="text-[13px] font-semibold" style={{ color: colors.muted }}>
                No orders assigned
              </Text>
              <Text className="text-[10px] mt-1" style={{ color: colors.subtle }}>
                Tap refresh to reload
              </Text>
            </View>
          }
        />
      )}
      {/* Pagination */}
      {!loading && (
        <View
          className="flex-row items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}
        >
          {/* Left: Per page dropdown + page info */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="flex-row items-center rounded-lg px-2.5 py-1.5"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              onPress={() => setShowPerPageMenu((v) => !v)}
              activeOpacity={0.6}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.text, fontFamily: FONT.mono }}>
                {perPage}
              </Text>
              <Text className="text-[8px] ml-1" style={{ color: colors.muted }}>▼</Text>
            </TouchableOpacity>
            <Text className="text-[10px]" style={{ color: colors.textSecondary, fontFamily: FONT.mono }}>
              Page {page} of {lastPage}
            </Text>
          </View>

          {/* Right: Prev / Next */}
          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              className="rounded-lg px-3 py-1.5"
              style={{
                backgroundColor: page > 1 ? colors.primaryDim : colors.glass,
                borderWidth: 1,
                borderColor: page > 1 ? colors.primaryBorder : colors.border,
                opacity: page > 1 ? 1 : 0.3,
              }}
              onPress={() => { if (page > 1) fetchOrders(page - 1); }}
              disabled={page <= 1 || loading}
              activeOpacity={0.6}
            >
              <Text className="text-[10px] font-bold" style={{ color: page > 1 ? colors.primary : colors.muted, fontFamily: FONT.mono }}>
                ‹
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-lg px-3 py-1.5"
              style={{
                backgroundColor: page < lastPage ? colors.primaryDim : colors.glass,
                borderWidth: 1,
                borderColor: page < lastPage ? colors.primaryBorder : colors.border,
                opacity: page < lastPage ? 1 : 0.3,
              }}
              onPress={() => { if (page < lastPage) fetchOrders(page + 1); }}
              disabled={page >= lastPage || loading}
              activeOpacity={0.6}
            >
              <Text className="text-[10px] font-bold" style={{ color: page < lastPage ? colors.primary : colors.muted, fontFamily: FONT.mono }}>
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Per page dropdown menu */}
      {showPerPageMenu && (
        <View
          className="absolute bottom-14 left-4 rounded-lg py-1"
          style={{ backgroundColor: colors.cardElevated, borderWidth: 1, borderColor: colors.border, zIndex: 10, elevation: 5, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } }}
        >
          {[15, 30, 50].map((n) => (
            <TouchableOpacity
              key={n}
              className="px-5 py-2"
              style={perPage === n ? { backgroundColor: colors.primaryDim } : {}}
              onPress={() => { setPerPage(n); setPage(1); setShowPerPageMenu(false); }}
              activeOpacity={0.6}
            >
              <Text className="text-[11px] font-bold" style={{ color: perPage === n ? colors.primary : colors.text, fontFamily: FONT.mono }}>
                {n} per page
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <CallLogsModal
        visible={logsModal.visible}
        order={logsModal.order}
        target={logsModal.target}
        onClose={() => setLogsModal({ visible: false, order: null, target: "customer" })}
      />
    </SafeAreaView>
  );
}