import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import Icon from "./Icon";
import PressableScale from "./PressableScale";
import BottomSheet from "./BottomSheet";

const POINTS = [
  {
    icon: "phone",
    title: "Read your call log",
    body: "Phone number, type, duration, and timestamp of each call from this session.",
  },
  {
    icon: "shield",
    title: "Stays on your device",
    body: "Audio is never accessed. Only structured call metadata is synced when you tap Sync.",
  },
  {
    icon: "refresh",
    title: "You stay in control",
    body: "Sync is manual. You decide when to send call data to the server.",
  },
];

export default function PermissionRationale({ open, onAllow, onDeny }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet open={open} onClose={onDeny}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.25,
          shadowRadius: 18,
          elevation: 24,
        }}
      >
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

        <View className="items-center px-6 pt-4 pb-2">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: colors.primary }}
          >
            <Icon name="phone" size={24} color="#fff" />
          </View>
          <Text
            className="text-[19px] font-bold text-center"
            style={{ color: colors.text, letterSpacing: -0.3 }}
          >
            Allow access to call log
          </Text>
          <Text
            className="text-[12px] text-center mt-1.5 px-2"
            style={{
              color: colors.textSecondary,
              fontFamily: FONT.mono,
              letterSpacing: 0.2,
              lineHeight: 17,
            }}
          >
            CallSync needs this to track and sync your CSR activity.
          </Text>
        </View>

        <View className="px-5 mt-3">
          {POINTS.map((p) => (
            <View
              key={p.title}
              className="flex-row mb-3"
            >
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: colors.primary + "18" }}
              >
                <Icon name={p.icon} size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: colors.text }}
                >
                  {p.title}
                </Text>
                <Text
                  className="text-[11px] mt-0.5"
                  style={{
                    color: colors.textSecondary,
                    lineHeight: 15,
                  }}
                >
                  {p.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          className="px-5 pt-2"
          style={{ paddingBottom: 12 }}
        >
          <PressableScale onPress={onAllow}>
            <View
              className="rounded-2xl py-4 items-center"
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.32,
                shadowRadius: 14,
                elevation: 8,
              }}
            >
              <Text
                className="text-[14px] font-bold"
                style={{
                  color: "#fff",
                  fontFamily: FONT.mono,
                  letterSpacing: 0.3,
                }}
              >
                Allow Access
              </Text>
            </View>
          </PressableScale>
          <PressableScale onPress={onDeny}>
            <View className="py-3 items-center mt-1">
              <Text
                className="text-[12px] font-semibold"
                style={{ color: colors.muted, fontFamily: FONT.mono }}
              >
                Not now
              </Text>
            </View>
          </PressableScale>
        </View>
        <View
          style={{
            height: insets.bottom,
            backgroundColor: colors.surface,
          }}
        />
      </View>
    </BottomSheet>
  );
}
