import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { login } from "../api/rmo";
import Icon from "../components/Icon";
import PressableScale from "../components/PressableScale";
import FadeSlideIn from "../components/FadeSlideIn";
import BottomSheet from "../components/BottomSheet";

const { width: SCREEN_W } = Dimensions.get("window");
const ILLUSTRATION = require("../assets/images/welcome-illustration.png");

function BlurOrbs({ color, mode }) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="orb1" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={mode === "dark" ? "0.45" : "0.55"} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="orb2" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={mode === "dark" ? "0.28" : "0.35"} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="orb3" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#A7F3D0" stopOpacity={mode === "dark" ? "0.18" : "0.5"} />
          <Stop offset="1" stopColor="#A7F3D0" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <SvgCircle cx={SCREEN_W * 0.25} cy={140} r={180} fill="url(#orb1)" />
      <SvgCircle cx={SCREEN_W * 0.85} cy={260} r={200} fill="url(#orb3)" />
      <SvgCircle cx={SCREEN_W * 0.55} cy={420} r={220} fill="url(#orb2)" />
      <SvgCircle cx={SCREEN_W * 0.1} cy={560} r={170} fill="url(#orb1)" />
    </Svg>
  );
}

function AgentRow({ user, selected, onSelect, colors, index }) {
  const active = selected?.id === user.id;
  return (
    <FadeSlideIn delay={Math.min(index * 25, 300)} offset={8}>
      <PressableScale onPress={() => onSelect(user)} scaleTo={0.98}>
        <View className="flex-row items-center px-2 py-3">
          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: active ? colors.primary : colors.glass }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{
                color: active ? "#fff" : colors.muted,
                fontFamily: FONT.mono,
              }}
            >
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-[14px] font-semibold"
              style={{ color: active ? colors.primary : colors.text }}
              numberOfLines={1}
            >
              {user.name}
            </Text>
          </View>
          {active && (
            <View
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Icon name="check" size={13} color="#fff" />
            </View>
          )}
        </View>
      </PressableScale>
    </FadeSlideIn>
  );
}

function AgentPickerSheet({ open, onClose, onSubmit, colors }) {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async (q = "") => {
    setLoadingUsers(true);
    try {
      const { data } = await login(q);
      setUsers(data.users || []);
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || err.message || "Failed to load"
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelected(null);
      setSearch("");
    }
  }, [open, fetchUsers]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchUsers(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, fetchUsers, open]);

  const submit = () => {
    if (!selected) {
      Alert.alert("Required", "Select your name.");
      return;
    }
    setSubmitting(true);
    onSubmit({ userId: selected.id, agentName: selected.name });
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.25,
          shadowRadius: 18,
          elevation: 24,
        }}
      >
        {/* grab handle */}
        <View className="items-center pt-2.5 pb-1">
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.muted,
              opacity: 0.4,
            }}
          />
        </View>

        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <View>
            <Text
              className="text-[10px]"
              style={{
                color: colors.muted,
                fontFamily: FONT.mono,
                letterSpacing: 0.7,
              }}
            >
              CHOOSE A PROFILE
            </Text>
            <Text
              className="text-[19px] font-bold mt-0.5"
              style={{ color: colors.text, letterSpacing: -0.3 }}
            >
              Who's logging in?
            </Text>
          </View>
          <PressableScale onPress={onClose} scaleTo={0.85} hitSlop={10}>
            <View
              className="w-9 h-9 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.glass }}
            >
              <Icon name="x" size={14} color={colors.muted} />
            </View>
          </PressableScale>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="px-5 mb-3">
            <View
              className="flex-row items-center rounded-2xl px-4"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1.5,
                borderColor: colors.border,
              }}
            >
              <Icon name="search" size={15} color={colors.muted} />
              <TextInput
                className="flex-1 py-3.5 px-3 text-[14px]"
                style={{ color: colors.text, fontFamily: FONT.mono }}
                placeholder="Search agents..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  if (selected && !t) setSelected(null);
                }}
                autoCapitalize="words"
              />
              {search.length > 0 && (
                <PressableScale
                  onPress={() => {
                    setSearch("");
                    setSelected(null);
                  }}
                  scaleTo={0.85}
                  hitSlop={10}
                >
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.glass }}
                  >
                    <Icon name="x" size={12} color={colors.muted} />
                  </View>
                </PressableScale>
              )}
            </View>
          </View>

          <View className="px-5" style={{ minHeight: 240, maxHeight: 340 }}>
            {loadingUsers && users.length === 0 ? (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator color={colors.primary} size="small" />
                <Text
                  className="text-[11px] mt-3"
                  style={{
                    color: colors.muted,
                    fontFamily: FONT.mono,
                    letterSpacing: 0.5,
                  }}
                >
                  LOADING AGENTS...
                </Text>
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item, index }) => (
                  <AgentRow
                    user={item}
                    selected={selected}
                    onSelect={setSelected}
                    colors={colors}
                    index={index}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View className="items-center py-10">
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center mb-2"
                      style={{ backgroundColor: colors.glass }}
                    >
                      <Icon name="search" size={20} color={colors.muted} />
                    </View>
                    <Text
                      className="text-[12px] font-semibold"
                      style={{ color: colors.muted }}
                    >
                      {search ? "No agents found" : "No agents available"}
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          <View
            className="px-5 pt-3"
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingBottom: 12,
            }}
          >
            <PressableScale onPress={submit} disabled={!selected || submitting}>
              <View
                className="rounded-2xl py-4 items-center"
                style={{
                  backgroundColor: selected ? colors.primary : colors.buttonDisabledBg,
                  opacity: selected ? 1 : 0.4,
                  shadowColor: selected ? colors.primary : "transparent",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: selected ? 0.35 : 0,
                  shadowRadius: 14,
                  elevation: selected ? 8 : 0,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    className="text-[14px] font-bold"
                    style={{
                      color: "#fff",
                      fontFamily: FONT.mono,
                      letterSpacing: 0.3,
                    }}
                  >
                    {selected ? `Continue as ${selected.name}` : "Select Agent"}
                  </Text>
                )}
              </View>
            </PressableScale>
          </View>
        </KeyboardAvoidingView>
        {/* explicit safe-area filler so the bottom of the sheet is always the surface color */}
        <View style={{ height: insets.bottom, backgroundColor: colors.surface }} />
      </View>
    </BottomSheet>
  );
}

export default function WelcomeScreen({ onSubmit }) {
  const { colors, mode, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Soft floating animation for illustration
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  // Background depending on theme
  const bg = mode === "dark" ? colors.ink : "#F0FDF4";

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: bg }}
      edges={[]}
    >
      <View className="flex-1" style={{ paddingTop: 18 }}>
        {/* Soft blurred orbs background */}
        <BlurOrbs color={colors.primary} mode={mode} />

        {/* Top bar */}
        <View className="flex-row justify-end px-5 pt-3 pb-2">
          <PressableScale onPress={toggle} scaleTo={0.88}>
            <View
              className="w-10 h-10 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Icon
                name={mode === "dark" ? "sun" : "moon"}
                size={16}
                color={colors.text}
              />
            </View>
          </PressableScale>
        </View>

        {/* Hero illustration + content */}
        <View className="flex-1 items-center justify-center px-6">
          <FadeSlideIn delay={80} offset={20}>
            <Animated.View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ translateY }],
              }}
            >
              <Image
                source={ILLUSTRATION}
                style={{
                  width: Math.min(SCREEN_W * 0.7, 280),
                  height: Math.min(SCREEN_W * 0.7, 280) * 1.55,
                  resizeMode: "contain",
                }}
              />
            </Animated.View>
          </FadeSlideIn>

          <FadeSlideIn delay={220} style={{ alignSelf: "stretch" }}>
            <View className="mt-4" style={{ width: "100%" }}>
              <Text
                className="text-[26px] font-bold"
                style={{
                  color: colors.text,
                  letterSpacing: -0.6,
                  lineHeight: 32,
                  textAlign: "left",
                }}
              >
                Track Every Call,{"\n"}Measure Every Win
              </Text>
              <Text
                className="text-[13px] mt-3"
                style={{
                  color: colors.textSecondary,
                  letterSpacing: 0.2,
                  lineHeight: 19,
                  textAlign: "left",
                }}
              >
                Automatically sync your call logs to monitor CSR and RMO
                activity from anywhere.
              </Text>
            </View>
          </FadeSlideIn>
        </View>

        {/* Bottom CTA */}
        <FadeSlideIn delay={360}>
          <View
            className="px-6"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <PressableScale onPress={() => setSheetOpen(true)}>
              <View
                className="rounded-full py-4 items-center flex-row justify-center"
                style={{
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 18,
                  elevation: 12,
                }}
              >
                <Text
                  className="text-[15px] font-bold"
                  style={{
                    color: "#fff",
                    fontFamily: FONT.mono,
                    letterSpacing: 0.4,
                  }}
                >
                  Get Started
                </Text>
                <View className="ml-2.5">
                  <Icon name="chevron-right" size={18} color="#fff" />
                </View>
              </View>
            </PressableScale>

            <View className="items-center mt-3">
              <Text
                className="text-[10px]"
                style={{
                  color: colors.muted,
                  fontFamily: FONT.mono,
                  letterSpacing: 0.6,
                }}
              >
                CSR & RMO ACTIVITY · META SUPPORT
              </Text>
            </View>
          </View>
        </FadeSlideIn>
      </View>

      <AgentPickerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={onSubmit}
        colors={colors}
      />
    </SafeAreaView>
  );
}
