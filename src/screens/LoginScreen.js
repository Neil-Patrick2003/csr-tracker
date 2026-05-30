import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

const APP_ICON = require("../assets/images/icon.png");
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { login } from "../api/rmo";
import Icon from "../components/Icon";
import PressableScale from "../components/PressableScale";
import FadeSlideIn from "../components/FadeSlideIn";

const { height: SCREEN_H } = Dimensions.get("window");
const HERO_H = Math.min(SCREEN_H * 0.38, 290);
const CARD_RADIUS = 32;

function HeroGlow({ color }) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="hg1" cx="50%" cy="50%" rx="65%" ry="70%">
          <Stop offset="0" stopColor={color} stopOpacity="0.65" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="hg2" cx="10%" cy="90%" rx="55%" ry="55%">
          <Stop offset="0" stopColor={color} stopOpacity="0.22" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="hg3" cx="92%" cy="8%" rx="40%" ry="40%">
          <Stop offset="0" stopColor={color} stopOpacity="0.16" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#hg1)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#hg2)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#hg3)" />
    </Svg>
  );
}

function InputField({ label, icon, focused, error, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: focused ? "#10B981" : "#4B5563",
          fontFamily: FONT.mono,
          letterSpacing: 0.8,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: focused
            ? "#10B981"
            : error
            ? "rgba(239,68,68,0.4)"
            : "rgba(255,255,255,0.07)",
          paddingHorizontal: 16,
          height: 54,
        }}
      >
        <Icon
          name={icon}
          size={16}
          color={focused ? "#10B981" : "#4B5563"}
        />
        {children}
      </View>
    </View>
  );
}

export default function LoginScreen({ onLogin }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef(null);

  const float = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      shake();
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await login(email.trim(), password);
      const user = data.user;
      onLogin({ userId: user.id, agentName: user.name });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError("Invalid email or password.");
      } else if (status === 403) {
        setError("Your account is not authorized for this workspace.");
      } else {
        setError(
          err.response?.data?.message || err.message || "Login failed. Please try again."
        );
      }
      shake();
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => { if (error) setError(""); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={[]}>
      {/* ── Hero ── always dark for contrast */}
      <View
        style={{
          height: HERO_H + insets.top,
          backgroundColor: "#060810",
          overflow: "hidden",
        }}
      >
        <HeroGlow color={colors.primary} />

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: insets.top,
          }}
        >
          {/* Floating app icon */}
          <Animated.View
            style={{ alignItems: "center", transform: [{ translateY: floatY }] }}
          >
            <Image
              source={APP_ICON}
              style={{
                width: 88,
                height: 88,
                borderRadius: 22,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.65,
                shadowRadius: 22,
              }}
            />
          </Animated.View>

          <FadeSlideIn delay={160}>
            <Text
              style={{
                color: "#fff",
                fontFamily: FONT.mono,
                fontSize: 22,
                fontWeight: "700",
                letterSpacing: -0.5,
                marginTop: 90,
              }}
            >
              CallSync
            </Text>
          </FadeSlideIn>

          <FadeSlideIn delay={240}>
            <Text
              style={{
                color: "rgba(255,255,255,0.40)",
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: 1.4,
                marginTop: 5,
              }}
            >
              CSR & RMO TRACKER
            </Text>
          </FadeSlideIn>
        </View>
      </View>

      {/* ── Form card ── overlaps hero bottom */}
      <KeyboardAvoidingView
        style={{ flex: 1, marginTop: -CARD_RADIUS }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderTopLeftRadius: CARD_RADIUS,
              borderTopRightRadius: CARD_RADIUS,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.22,
              shadowRadius: 24,
              elevation: 24,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: insets.bottom + 28,
            }}
          >
            {/* Grab handle */}
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.subtle,
                  opacity: 0.5,
                }}
              />
            </View>

            {/* Heading */}
            <FadeSlideIn delay={100}>
              <View style={{ marginBottom: 28 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: colors.text,
                    letterSpacing: -0.5,
                  }}
                >
                  Welcome back
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 5,
                    lineHeight: 19,
                  }}
                >
                  Sign in with your CSR credentials to continue
                </Text>
              </View>
            </FadeSlideIn>

            {/* Inputs + error — all shake together */}
            <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
              {/* Email */}
              <FadeSlideIn delay={160}>
                <InputField
                  label="EMAIL"
                  icon="mail"
                  focused={focusedField === "email"}
                  error={!!error}
                >
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 15,
                      color: colors.text,
                      fontFamily: FONT.mono,
                    }}
                    placeholder="you@company.com"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={(t) => { setEmail(t); clearError(); }}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="email-address"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </InputField>
              </FadeSlideIn>

              {/* Password */}
              <FadeSlideIn delay={210}>
                <InputField
                  label="PASSWORD"
                  icon="lock"
                  focused={focusedField === "password"}
                  error={!!error}
                >
                  <TextInput
                    ref={passwordRef}
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      fontSize: 15,
                      color: colors.text,
                      fontFamily: FONT.mono,
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={(t) => { setPassword(t); clearError(); }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <PressableScale
                    onPress={() => setShowPassword((v) => !v)}
                    scaleTo={0.82}
                    hitSlop={12}
                  >
                    <Icon
                      name={showPassword ? "eye-off" : "eye"}
                      size={16}
                      color={focusedField === "password" ? colors.primary : colors.muted}
                    />
                  </PressableScale>
                </InputField>
              </FadeSlideIn>

              {/* Error banner */}
              {error.length > 0 && (
                <FadeSlideIn delay={0}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.redDim,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.redBorder,
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      marginBottom: 4,
                    }}
                  >
                    <Icon name="alert-circle" size={14} color={colors.red} />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: colors.red,
                        fontFamily: FONT.mono,
                        marginLeft: 10,
                      }}
                    >
                      {error}
                    </Text>
                  </View>
                </FadeSlideIn>
              )}
            </Animated.View>

            {/* Sign in button */}
            <FadeSlideIn delay={280}>
              <View style={{ marginTop: error ? 18 : 8 }}>
                <PressableScale onPress={handleLogin} disabled={loading} scaleTo={0.97}>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 16,
                      height: 56,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      opacity: loading ? 0.72 : 1,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: 0.42,
                      shadowRadius: 20,
                      elevation: 14,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: "700",
                            fontFamily: FONT.mono,
                            letterSpacing: 0.4,
                          }}
                        >
                          Sign In
                        </Text>
                        <View style={{ marginLeft: 8 }}>
                          <Icon name="chevron-right" size={18} color="#fff" />
                        </View>
                      </>
                    )}
                  </View>
                </PressableScale>
              </View>
            </FadeSlideIn>

            {/* Footer */}
            <View style={{ alignItems: "center", marginTop: 28 }}>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.muted,
                  fontFamily: FONT.mono,
                  letterSpacing: 0.9,
                }}
              >
                META SUPPORT · CSR & RMO ACTIVITY
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
