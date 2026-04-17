import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { login } from "../api/rmo";

function UserRow({ user, selected, onSelect, colors }) {
  const active = selected?.id === user.id;
  return (
    <TouchableOpacity
      className="flex-row items-center rounded-lg px-3 py-2.5 mb-1"
      style={{
        backgroundColor: active ? colors.primaryDim : "transparent",
        borderWidth: 1,
        borderColor: active ? colors.primaryBorder : "transparent",
      }}
      onPress={() => onSelect(user)}
      activeOpacity={0.55}
    >
      <View
        className="w-7 h-7 rounded-md items-center justify-center mr-2.5"
        style={{ backgroundColor: active ? colors.primaryDim : colors.glass }}
      >
        <Text className="text-[10px] font-bold" style={{ color: active ? colors.primary : colors.muted }}>
          {user.name?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </View>
      <Text
        className="flex-1 text-[13px] font-semibold"
        style={{ color: active ? colors.primary : colors.text }}
        numberOfLines={1}
      >
        {user.name}
      </Text>
      {active && (
        <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
          <Text className="text-[9px] font-bold" style={{ color: "#fff" }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SetupScreen({ onSubmit }) {
  const { colors, mode, toggle } = useTheme();
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="flex-1 px-5 pt-4">
          {/* Top bar */}
          <View className="flex-row justify-end mb-8">
            <TouchableOpacity
              className="w-8 h-8 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border }}
              onPress={toggle}
            >
              <Text className="text-[13px]" style={{ color: colors.muted }}>
                {mode === "dark" ? "☀︎" : "☾"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Branding */}
          <View className="items-center mb-8">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mb-3"
              style={{ backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primaryBorder }}
            >
              <Text className="text-[18px] font-bold" style={{ color: colors.primary, fontFamily: FONT.mono }}>CS</Text>
            </View>
            <Text className="text-[18px] font-bold" style={{ color: colors.text, fontFamily: FONT.mono, letterSpacing: -0.4 }}>
              CSR Tracker
            </Text>
            <Text className="text-[12px] mt-1" style={{ color: colors.muted }}>
              Select your name to continue
            </Text>
          </View>

          {/* Search */}
          <View
            className="flex-row items-center rounded-lg px-3 mb-3"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
          >
            <Text className="text-[12px] mr-2" style={{ color: colors.muted }}>⌕</Text>
            <TextInput
              className="flex-1 py-2.5 text-[13px]"
              style={{ color: colors.text, fontFamily: FONT.mono }}
              placeholder="Search agents..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={(t) => { setSearch(t); if (selected && !t) setSelected(null); }}
              autoCapitalize="words"
            />
          </View>

          {/* List */}
          <View className="flex-1 mb-3">
            {loadingUsers && users.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <UserRow user={item} selected={selected} onSelect={setSelected} colors={colors} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View className="items-center py-12">
                    <Text className="text-[12px]" style={{ color: colors.muted }}>
                      {search ? "No agents found" : "No agents available"}
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            className="rounded-lg py-3.5 items-center mb-4"
            style={{
              backgroundColor: selected ? colors.primary : colors.buttonDisabledBg,
              opacity: selected ? 1 : 0.4,
            }}
            onPress={submit}
            disabled={!selected || submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-[13px] font-bold" style={{ color: "#fff", fontFamily: FONT.mono }}>
                {selected ? `Continue as ${selected.name}` : "Select Agent"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}