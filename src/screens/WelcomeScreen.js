import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import Icon from "../components/Icon";
import PressableScale from "../components/PressableScale";
import FadeSlideIn from "../components/FadeSlideIn";

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

export default function WelcomeScreen({ onGetStarted }) {
  const { colors, mode, toggle } = useTheme();
  const insets = useSafeAreaInsets();

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
            <PressableScale onPress={onGetStarted}>
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

    </SafeAreaView>
  );
}
