import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONT } from "../constants/theme";
import Icon from "./Icon";
import PressableScale from "./PressableScale";
import BottomSheet from "./BottomSheet";

function SectionLabel({ children, colors }) {
  return (
    <Text
      className="font-bold mt-4 mb-2 px-5"
      style={{
        color: colors.muted,
        letterSpacing: 1,
        fontSize: 10,
        textTransform: "uppercase",
        fontFamily: FONT.mono,
      }}
    >
      {children}
    </Text>
  );
}

function Row({
  icon,
  label,
  rightLabel,
  colors,
  onPress,
  destructive,
  disabled,
  iconColor,
  iconBg,
}) {
  const fg = destructive ? colors.red : colors.text;
  const ic = iconColor || (destructive ? colors.red : colors.text);
  const bg = iconBg || (destructive ? colors.redDim : colors.glass);
  return (
    <PressableScale onPress={onPress} disabled={disabled} scaleTo={0.98}>
      <View
        className="flex-row items-center px-5 py-3"
        style={{ opacity: disabled ? 0.4 : 1 }}
      >
        <View
          className="w-9 h-9 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: bg }}
        >
          <Icon name={icon} size={16} color={ic} />
        </View>
        <Text
          className="flex-1 text-[14px] font-semibold"
          style={{ color: fg }}
        >
          {label}
        </Text>
        {rightLabel ? (
          <Text
            className="text-[12px] font-bold mr-1"
            style={{ color: colors.textSecondary, fontFamily: FONT.mono }}
          >
            {rightLabel}
          </Text>
        ) : null}
        <Icon name="chevron-right" size={16} color={colors.muted} />
      </View>
    </PressableScale>
  );
}

export default function SettingsSheet({
  open,
  onClose,
  agentName,
  mode,
  onToggleTheme,
  onHelp,
  onLogout,
  hasUnsynced,
  colors,
}) {
  const insets = useSafeAreaInsets();
  return (
    <BottomSheet open={open} onClose={onClose}>
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

        {/* profile header */}
        <View className="flex-row items-center px-5 pt-3 pb-3">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{
              backgroundColor: colors.primary,
            }}
          >
            <Text
              className="text-[16px] font-bold"
              style={{ color: "#fff", fontFamily: FONT.mono }}
            >
              {agentName?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-[10px]"
              style={{
                color: colors.muted,
                fontFamily: FONT.mono,
                letterSpacing: 0.7,
              }}
            >
              SIGNED IN AS
            </Text>
            <Text
              className="text-[16px] font-bold mt-0.5"
              style={{ color: colors.text, letterSpacing: -0.3 }}
              numberOfLines={1}
            >
              {agentName || "Agent"}
            </Text>
          </View>
          <PressableScale onPress={onClose} scaleTo={0.85} hitSlop={10}>
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.glass }}
            >
              <Icon name="x" size={14} color={colors.muted} />
            </View>
          </PressableScale>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginHorizontal: 20,
          }}
        />

        <SectionLabel colors={colors}>Appearance</SectionLabel>
        <Row
          icon={mode === "dark" ? "sun" : "moon"}
          label="Theme"
          rightLabel={mode === "dark" ? "Dark" : "Light"}
          colors={colors}
          onPress={onToggleTheme}
        />

        <SectionLabel colors={colors}>Support</SectionLabel>
        <Row
          icon="help-circle"
          label="Help & FAQs"
          colors={colors}
          onPress={onHelp}
        />

        <SectionLabel colors={colors}>Account</SectionLabel>
        <Row
          icon="log-out"
          label="Log out"
          colors={colors}
          onPress={onLogout}
          destructive
          disabled={hasUnsynced}
        />
        {hasUnsynced && (
          <Text
            className="text-[11px] px-5 mt-1"
            style={{ color: colors.muted, fontFamily: FONT.mono }}
          >
            Sync remaining call logs before logging out.
          </Text>
        )}

        <View style={{ height: insets.bottom + 12, backgroundColor: colors.surface }} />
      </View>
    </BottomSheet>
  );
}
