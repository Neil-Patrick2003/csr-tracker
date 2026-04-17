import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { FONT } from "../constants/theme";
import { getPages, getShops } from "../api/rmo";

const STATUSES = [
  "PENDING", "DELIVERED", "RIDER OTW", "RETURNING", "RESCHEDULED",
  "CX CBR", "RIDER CBR", "CANCELLED", "WRONG SEGMENT CODE",
  "CX RINGING", "RIDER RINGING", "IN TRANSIT",
];

const PARCEL_STATUSES = [
  "pending", "delivering", "delivered", "problematic", "returning", "undeliverable",
];

function CheckItem({ label, active, onToggle, colors }) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-2"
      onPress={onToggle}
      activeOpacity={0.55}
    >
      <View
        className="w-5 h-5 rounded items-center justify-center mr-2.5"
        style={{
          backgroundColor: active ? colors.primary : colors.glass,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.border,
        }}
      >
        {active && <Text className="text-[9px] font-bold" style={{ color: "#fff" }}>✓</Text>}
      </View>
      <Text
        className="text-[12px]"
        style={{ color: active ? colors.text : colors.textSecondary }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Section({ title, children, colors }) {
  return (
    <View className="mb-4">
      <Text className="text-[10px] font-bold mb-2" style={{ color: colors.muted, letterSpacing: 0.8 }}>
        {title}
      </Text>
      <View className="flex-row flex-wrap">{children}</View>
    </View>
  );
}

function ChipCheck({ label, active, onToggle, colors }) {
  return (
    <TouchableOpacity
      className="rounded-md px-2.5 py-1.5 mr-1.5 mb-1.5"
      style={{
        backgroundColor: active ? colors.primaryDim : colors.glass,
        borderWidth: 1,
        borderColor: active ? colors.primaryBorder : colors.border,
      }}
      onPress={onToggle}
      activeOpacity={0.55}
    >
      <Text
        className="text-[10px] font-medium"
        style={{ color: active ? colors.primary : colors.textSecondary }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function FilterBar({ filters, onFiltersChange, userId, orders = [] }) {
  const { colors } = useTheme();
  const [pages, setPages] = useState([]);
  const [shops, setShops] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState(filters.search || "");

  // Draft state for the modal — only applied on "Apply"
  const [draft, setDraft] = useState({
    status: [],
    page_id: [],
    shop_id: [],
    parcel_status: [],
  });

  useEffect(() => {
    getPages().then(({ data }) => setPages(data.pages || data.data || [])).catch(() => {});
    getShops().then(({ data }) => setShops(data.shops || data.data || [])).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (filters.search || "")) {
        onFiltersChange({ ...filters, search: search || undefined });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const activeCount =
    (filters.status ? filters.status.split(",").length : 0) +
    (filters.page_id ? filters.page_id.split(",").length : 0) +
    (filters.shop_id ? filters.shop_id.split(",").length : 0) +
    (filters.parcel_status ? filters.parcel_status.split(",").length : 0);

  const openModal = () => {
    // Load current filters into draft
    setDraft({
      status: filters.status ? filters.status.split(",") : [],
      page_id: filters.page_id ? filters.page_id.split(",") : [],
      shop_id: filters.shop_id ? filters.shop_id.split(",") : [],
      parcel_status: filters.parcel_status ? filters.parcel_status.split(",") : [],
    });
    setShowModal(true);
  };

  const toggleDraft = (key, value) => {
    const v = String(value);
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].includes(v) ? prev[key].filter((s) => s !== v) : [...prev[key], v],
    }));
  };

  const applyFilters = () => {
    onFiltersChange({
      ...filters,
      status: draft.status.length > 0 ? draft.status.join(",") : undefined,
      page_id: draft.page_id.length > 0 ? draft.page_id.join(",") : undefined,
      shop_id: draft.shop_id.length > 0 ? draft.shop_id.join(",") : undefined,
      parcel_status: draft.parcel_status.length > 0 ? draft.parcel_status.join(",") : undefined,
    });
    setShowModal(false);
  };

  const clearAll = () => {
    setDraft({ status: [], page_id: [], shop_id: [], parcel_status: [] });
  };

  const draftCount = draft.status.length + draft.page_id.length + draft.shop_id.length + draft.parcel_status.length;

  return (
    <View style={{ backgroundColor: colors.surface }}>
      {/* Search + Filter button */}
      <View className="flex-row items-center mx-4 mt-2 mb-2 gap-2">
        <View
          className="flex-1 flex-row items-center rounded-lg px-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-[11px] mr-2" style={{ color: colors.muted }}>⌕</Text>
          <TextInput
            className="flex-1 py-2 text-[12px]"
            style={{ color: colors.text, fontFamily: FONT.mono }}
            placeholder="Search orders..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(""); onFiltersChange({ ...filters, search: undefined }); }}>
              <Text className="text-[14px]" style={{ color: colors.muted }}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter button */}
        <TouchableOpacity
          className="h-10 rounded-lg px-3 flex-row items-center justify-center"
          style={{
            backgroundColor: activeCount > 0 ? colors.primaryDim : colors.card,
            borderWidth: 1,
            borderColor: activeCount > 0 ? colors.primaryBorder : colors.border,
          }}
          onPress={openModal}
          activeOpacity={0.55}
        >
          <Text className="text-[11px]" style={{ color: activeCount > 0 ? colors.primary : colors.muted }}>⫧</Text>
          <Text
            className="text-[10px] font-bold ml-1.5"
            style={{ color: activeCount > 0 ? colors.primary : colors.textSecondary }}
          >
            Filter
          </Text>
          {activeCount > 0 && (
            <View
              className="rounded-full ml-1.5 w-4 h-4 items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-[8px] font-bold" style={{ color: "#fff" }}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity
          className="flex-1"
          style={{ backgroundColor: colors.overlay }}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        />
        <View
          className="rounded-t-2xl pt-4 pb-6"
          style={{ backgroundColor: colors.cardElevated, borderTopWidth: 1, borderTopColor: colors.border, maxHeight: "80%" }}
        >
          {/* Handle */}
          <View className="items-center mb-3">
            <View className="w-8 h-1 rounded-full" style={{ backgroundColor: colors.subtle }} />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 mb-4">
            <Text className="text-[15px] font-bold" style={{ color: colors.text }}>Filters</Text>
            <View className="flex-row items-center gap-3">
              {draftCount > 0 && (
                <TouchableOpacity onPress={clearAll}>
                  <Text className="text-[11px] font-semibold" style={{ color: colors.red }}>Clear all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ color: colors.muted, fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
            {/* Status */}
            <Section title="ORDER STATUS" colors={colors}>
              {STATUSES.map((s) => (
                <ChipCheck
                  key={s}
                  label={s}
                  active={draft.status.includes(s)}
                  onToggle={() => toggleDraft("status", s)}
                  colors={colors}
                />
              ))}
            </Section>

            {/* Page */}
            {pages.length > 0 && (
              <Section title="PAGE" colors={colors}>
                {pages.map((p) => (
                  <ChipCheck
                    key={p.id}
                    label={p.name}
                    active={draft.page_id.includes(String(p.id))}
                    onToggle={() => toggleDraft("page_id", p.id)}
                    colors={colors}
                  />
                ))}
              </Section>
            )}

            {/* Shop */}
            {shops.length > 0 && (
              <Section title="SHOP" colors={colors}>
                {shops.map((s) => (
                  <ChipCheck
                    key={s.id}
                    label={s.name}
                    active={draft.shop_id.includes(String(s.id))}
                    onToggle={() => toggleDraft("shop_id", s.id)}
                    colors={colors}
                  />
                ))}
              </Section>
            )}

            {/* Parcel Status */}
            <Section title="PARCEL STATUS" colors={colors}>
              {PARCEL_STATUSES.map((s) => (
                <ChipCheck
                  key={s}
                  label={s}
                  active={draft.parcel_status.includes(s)}
                  onToggle={() => toggleDraft("parcel_status", s)}
                  colors={colors}
                />
              ))}
            </Section>
          </ScrollView>

          {/* Apply button */}
          <View className="px-5 pt-3">
            <TouchableOpacity
              className="rounded-lg py-3.5 items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={applyFilters}
              activeOpacity={0.7}
            >
              <Text className="text-[13px] font-bold" style={{ color: "#fff" }}>
                Apply{draftCount > 0 ? ` (${draftCount})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}