import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function Skeleton({
  width,
  height,
  borderRadius = 6,
  style,
  bg,
}) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: bg || colors.glass,
          opacity,
        },
        style,
      ]}
    />
  );
}
