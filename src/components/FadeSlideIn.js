import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export default function FadeSlideIn({
  children,
  delay = 0,
  duration = 380,
  offset = 14,
  style,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translate, delay, duration]);

  return (
    <Animated.View
      style={[
        { opacity, transform: [{ translateY: translate }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
