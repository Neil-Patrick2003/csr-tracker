import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
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

const { width: SCREEN_W } = Dimensions.get("window");

function BlurOrbs({ color, mode }) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="lo1" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={mode === "dark" ? "0.38" : "0.48"} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="lo2" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={mode === "dark" ? "0.22" : "0.30"} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <SvgCircle cx={SCREEN_W * 0.85} cy={100} r={160} fill="url(#lo1)" />
      <SvgCircle cx={SCREEN_W * 0.1} cy={460} r={180} fill="url(#lo2)" />
    </Svg>
  );
}

function InputField({ label, icon, value, onChangeText, placeholder, secureTextEntry, keyboardType, returnKeyType, onSubmitEditing, inputRef, rightElement, colors }) {
  const focused = value.length > 0;
  return (
    <View className="mb-4">
      <Text
        className="text-[11px] font-semibold mb-2"
        style={{ color: colors.muted, fontFamily: FONT.mono, letterSpacing: 0.7 }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-2xl px-4"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1.5,
          borderColor: focused ? colors.primary : colors.border,
          height: 54,
        }}
      >
        <Icon name={icon} size={16} color={focused ? colors.primary : colors.muted} />
        <TextInput
          ref={inputRef}
          className="flex-1 py-3.5 px-3 text-[15px]"
          style={{ color: colors.text, fontFamily: FONT.mono }}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {rightElement}
      </View>
    </View>
  );
}

export default function LoginScreen({ onLogin }) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const passwordRef = useRef(null);

  const bg = mode === "dark" ? colors.ink : "#F0FDF4";

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
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
        setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => { if (error) setError(""); };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bg }} edges={[]}>
      <BlurOrbs color={colors.primary} mode={mode} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6" style={{ paddingTop: insets.top + 32 }}>
            {/* Brand */}
            <FadeSlideIn delay={60}>
              <View className="mb-10">
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Icon name="phone" size={18} color="#fff" />
                  </View>
                  <Text
                    className="text-[26px] font-bold"
                    style={{ color: colors.primary, fontFamily: FONT.mono, letterSpacing: -0.8 }}
                  >
                    CallSync
                  </Text>
                </View>
                <Text
                  className="text-[22px] font-bold mt-2"
                  style={{ color: colors.text, letterSpacing: -0.5 }}
                >
                  Welcome back
                </Text>
                <Text
                  className="text-[13px] mt-1.5"
                  style={{ color: colors.textSecondary, lineHeight: 19 }}
                >
                  Sign in with your CSR credentials to continue
                </Text>
              </View>
            </FadeSlideIn>

            {/* Email field */}
            <FadeSlideIn delay={160}>
              <InputField
                label="EMAIL"
                icon="mail"
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                placeholder="you@company.com"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                colors={colors}
              />
            </FadeSlideIn>

            {/* Password field */}
            <FadeSlideIn delay={220}>
              <InputField
                label="PASSWORD"
                icon="lock"
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                inputRef={passwordRef}
                colors={colors}
                rightElement={
                  <PressableScale
                    onPress={() => setShowPassword((v) => !v)}
                    scaleTo={0.85}
                    hitSlop={10}
                  >
                    <Icon
                      name={showPassword ? "eye-off" : "eye"}
                      size={16}
                      color={colors.muted}
                    />
                  </PressableScale>
                }
              />
            </FadeSlideIn>

            {/* Error banner */}
            {error.length > 0 && (
              <FadeSlideIn delay={0}>
                <View
                  className="rounded-xl px-4 py-3 mb-5 flex-row items-center"
                  style={{
                    backgroundColor: colors.redDim,
                    borderWidth: 1,
                    borderColor: colors.redBorder,
                  }}
                >
                  <Icon name="alert-circle" size={14} color={colors.red} />
                  <Text
                    className="text-[13px] ml-2.5 flex-1"
                    style={{ color: colors.red, fontFamily: FONT.mono }}
                  >
                    {error}
                  </Text>
                </View>
              </FadeSlideIn>
            )}

            {/* Sign in button */}
            <FadeSlideIn delay={300}>
              <PressableScale onPress={handleLogin} disabled={loading} scaleTo={0.97}>
                <View
                  className="rounded-2xl items-center justify-center"
                  style={{
                    backgroundColor: colors.primary,
                    opacity: loading ? 0.75 : 1,
                    height: 56,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.38,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      className="text-[15px] font-bold"
                      style={{ color: "#fff", fontFamily: FONT.mono, letterSpacing: 0.4 }}
                    >
                      Sign In
                    </Text>
                  )}
                </View>
              </PressableScale>
            </FadeSlideIn>

            {/* Footer */}
            <View className="items-center mt-8">
              <Text
                className="text-[10px]"
                style={{ color: colors.muted, fontFamily: FONT.mono, letterSpacing: 0.7 }}
              >
                CSR & RMO ACTIVITY · META SUPPORT
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
