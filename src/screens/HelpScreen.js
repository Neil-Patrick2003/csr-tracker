import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import Icon from "../components/Icon";
import PressableScale from "../components/PressableScale";
import FadeSlideIn from "../components/FadeSlideIn";

const FAQS = [
  {
    icon: "phone",
    title: "How does call sync work?",
    body: "Tap Sync on the dashboard to push every call made since your last sync to the server. Calls are read straight from the device call log — nothing is recorded.",
  },
  {
    icon: "shield",
    title: "What permissions are needed?",
    body: "The app needs access to your call log to read durations, types, and timestamps. It does not access call audio or contacts beyond the cached caller name.",
  },
  {
    icon: "refresh",
    title: "Why does a call show as Pending?",
    body: "A call is marked Synced once the server has received it. If it shows Pending after a sync, the call may have happened after the sync completed — pull to refresh, then sync again.",
  },
  {
    icon: "log-out",
    title: "Can I log out with pending calls?",
    body: "Sync your call logs first. Logging out clears your local session, so any unsynced calls would be lost on the server.",
  },
  {
    icon: "mail",
    title: "Need to report something?",
    body: "Reach the team at the on-forge support channel. Include your agent name and the time of the issue so we can look it up quickly.",
  },
];

function FaqItem({ item, colors, index }) {
  return (
    <FadeSlideIn delay={Math.min(index * 60, 360)}>
      <View
        className="rounded-xl p-4 mb-2.5 flex-row"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View
          className="w-9 h-9 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: colors.primary + "18" }}
        >
          <Icon name={item.icon} size={16} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text
            className="text-[14px] font-bold mb-1"
            style={{ color: colors.text }}
          >
            {item.title}
          </Text>
          <Text
            className="text-[12px]"
            style={{ color: colors.textSecondary, lineHeight: 18 }}
          >
            {item.body}
          </Text>
        </View>
      </View>
    </FadeSlideIn>
  );
}

export default function HelpScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.surface }}
      edges={[]}
    >
      <View style={{ paddingTop: 10 }}>
        <View className="flex-row items-center justify-between px-5 pb-2">
          <View className="flex-row items-center">
            <PressableScale onPress={() => navigation.goBack()} scaleTo={0.88}>
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Icon name="arrow-left" size={15} color={colors.text} />
              </View>
            </PressableScale>
            <Text
              className="text-[18px] font-bold"
              style={{ color: colors.text, letterSpacing: -0.3 }}
            >
              Help
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={40}>
          <View className="mb-4">
            <Text
              className="text-[22px] font-bold"
              style={{ color: colors.text, letterSpacing: -0.5 }}
            >
              Need a hand?
            </Text>
            <Text
              className="text-[13px] mt-1"
              style={{ color: colors.textSecondary }}
            >
              Quick answers to the most common questions.
            </Text>
          </View>
        </FadeSlideIn>

        {FAQS.map((item, idx) => (
          <FaqItem key={item.title} item={item} colors={colors} index={idx} />
        ))}

        <FadeSlideIn delay={400}>
          <View
            className="rounded-xl p-4 mt-3 flex-row items-center"
            style={{
              backgroundColor: colors.primary + "10",
              borderWidth: 1,
              borderColor: colors.primary + "25",
            }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: colors.primary }}
            >
              <Icon name="mail" size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text
                className="text-[13px] font-bold"
                style={{ color: colors.text }}
              >
                Still stuck?
              </Text>
              <Text
                className="text-[11px] mt-0.5"
                style={{ color: colors.textSecondary }}
              >
                Ping your team lead with the agent name and timestamp.
              </Text>
            </View>
          </View>
        </FadeSlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}
