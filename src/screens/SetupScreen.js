import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { login } from "../api/rmo";

function UserRow({ user, selected, onSelect, colors }) {
  const active = selected?.id === user.id;
  return (
    <TouchableOpacity
      className="flex-row items-center rounded-xl px-4 py-3.5 mb-2"
      style={{
        backgroundColor: active ? colors.primaryDim : colors.card,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : colors.border,
      }}
      onPress={() => onSelect(user)}
      activeOpacity={0.55}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: active ? colors.primary : colors.glass }}
      >
        <Text className="text-[13px] font-bold" style={{ color: active ? "#fff" : colors.muted }}>
          {user.name?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </View>
      <View className="flex-1">
        <Text
          className="text-[14px] font-semibold"
          style={{ color: active ? colors.primary : colors.text }}
          numberOfLines={1}
        >
          {user.name}
        </Text>
      </View>
      {active && (
        <View
          className="w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-[11px] font-bold" style={{ color: "#fff" }}>
            {"\u2713"}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SetupScreen({ onSubmit }) {
  const { colors, mode, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async (q = "") => {
    setLoadingUsers(true);
    try {
      const { data } = await login(q);
      setUsers(data.users || []);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to load");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, fetchUsers]);

  const submit = () => {
    if (!selected) { Alert.alert("Required", "Select your name."); return; }
    setSubmitting(true);
    onSubmit({ userId: selected.id, agentName: selected.name });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.ink }} edges={[]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          {/* Top bar */}
          <View className="flex-row justify-end px-5 pt-3 pb-2">
            <TouchableOpacity
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border }}
              onPress={toggle}
              activeOpacity={0.6}
            >
              <Text className="text-[14px]" style={{ color: colors.muted }}>
                {mode === "dark" ? "\u2600\uFE0E" : "\u263E"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Branding */}
          <View className="items-center mb-8 mt-4">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-[22px] font-bold" style={{ color: "#fff", fontFamily: FONT.mono }}>
                CL
              </Text>
            </View>
            <Text className="text-[22px] font-bold" style={{ color: colors.text, fontFamily: FONT.mono, letterSpacing: -0.5 }}>
              Call Log Tracker
            </Text>
            <Text className="text-[13px] mt-2" style={{ color: colors.muted }}>
              Select your name to continue
            </Text>
          </View>

          {/* Search */}
          <View className="px-5 mb-3">
            <View
              className="flex-row items-center rounded-xl px-4"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1.5,
                borderColor: colors.border,
              }}
            >
              <Text className="text-[14px] mr-2.5" style={{ color: colors.muted }}>{"\u2315"}</Text>
              <TextInput
                className="flex-1 py-3 text-[14px]"
                style={{ color: colors.text, fontFamily: FONT.mono }}
                placeholder="Search agents..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={(t) => { setSearch(t); if (selected && !t) setSelected(null); }}
                autoCapitalize="words"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => { setSearch(""); setSelected(null); }} activeOpacity={0.5}>
                  <Text className="text-[16px]" style={{ color: colors.muted }}>{"\u00D7"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          <View className="flex-1 px-5 mb-2">
            {loadingUsers && users.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.primary} size="small" />
                <Text className="text-[11px] mt-2" style={{ color: colors.muted }}>Loading agents...</Text>
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <UserRow user={item} selected={selected} onSelect={setSelected} colors={colors} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
                ListEmptyComponent={
                  <View className="items-center py-16">
                    <Text className="text-[24px] mb-3" style={{ opacity: 0.3 }}>{"\u{1F50D}"}</Text>
                    <Text className="text-[13px] font-semibold" style={{ color: colors.muted }}>
                      {search ? "No agents found" : "No agents available"}
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          {/* Submit */}
          <View
            className="px-5 pt-3 pb-3"
            style={{
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 12,
            }}
          >
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{
                backgroundColor: selected ? colors.primary : colors.buttonDisabledBg,
                opacity: selected ? 1 : 0.4,
                shadowColor: selected ? colors.primary : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: selected ? 0.3 : 0,
                shadowRadius: 12,
                elevation: selected ? 6 : 0,
              }}
              onPress={submit}
              disabled={!selected || submitting}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-[14px] font-bold" style={{ color: "#fff", fontFamily: FONT.mono }}>
                  {selected ? `Continue as ${selected.name}` : "Select Agent"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
