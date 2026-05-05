import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { Animated, Easing, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import Icon from "./Icon";

const ToastContext = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const translate = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: 80,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [translate, opacity]);

  const show = useCallback(
    ({ message, type = "info", duration = 2400 }) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type, key: Date.now() });
      translate.setValue(80);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translate, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      timer.current = setTimeout(dismiss, duration);
    },
    [translate, opacity, dismiss]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <ToastView
          toast={toast}
          translate={translate}
          opacity={opacity}
          onDismiss={dismiss}
        />
      )}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, translate, opacity, onDismiss }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const palette = (() => {
    if (toast.type === "success")
      return { bg: colors.green, fg: "#fff", icon: "check" };
    if (toast.type === "error")
      return { bg: colors.red, fg: "#fff", icon: "x" };
    return { bg: colors.text, fg: colors.surface, icon: "check" };
  })();

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        { justifyContent: "flex-end" },
      ]}
    >
      <Animated.View
        style={{
          marginHorizontal: 16,
          marginBottom: insets.bottom + 90,
          transform: [{ translateY: translate }],
          opacity,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: palette.bg,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 14,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Icon name={palette.icon} size={14} color={palette.fg} />
          </View>
          <Text
            numberOfLines={2}
            style={{
              flex: 1,
              color: palette.fg,
              fontSize: 13,
              fontWeight: "700",
              fontFamily: FONT.mono,
              letterSpacing: 0.2,
            }}
          >
            {toast.message}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
