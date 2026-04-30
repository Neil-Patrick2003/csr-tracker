import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Dimensions,
  View,
} from "react-native";

const { height: SCREEN_H } = Dimensions.get("window");

export default function BottomSheet({ open, onClose, children, backdropOpacity = 0.55 }) {
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: open ? 0 : 1,
      duration: open ? 320 : 220,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, slide]);

  const backdropFade = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [backdropOpacity, 0],
  });

  const sheetTranslate = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_H],
  });

  return (
    <View
      pointerEvents={open ? "auto" : "none"}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#000", opacity: backdropFade },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateY: sheetTranslate }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
