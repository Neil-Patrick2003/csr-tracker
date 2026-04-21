import { Platform } from "react-native";

export const FONT = {
  mono: Platform.OS === "ios" ? "Menlo" : "monospace",
};

const emerald = {
  primary: "#10B981",
  primaryLight: "#6EE7B7",
  primaryDim: "rgba(16,185,129,0.10)",
  primaryBorder: "rgba(16,185,129,0.20)",
  primaryMuted: "rgba(16,185,129,0.50)",
};

const palette = {
  green: "#10B981",
  greenDim: "rgba(16,185,129,0.10)",
  greenBorder: "rgba(16,185,129,0.20)",
  red: "#EF4444",
  redDim: "rgba(239,68,68,0.10)",
  redBorder: "rgba(239,68,68,0.20)",
  blue: "#3B82F6",
  blueDim: "rgba(59,130,246,0.10)",
  blueBorder: "rgba(59,130,246,0.20)",
  amber: "#F59E0B",
  amberDim: "rgba(245,158,11,0.10)",
  amberBorder: "rgba(245,158,11,0.20)",
};

export const dark = {
  ...palette,
  ...emerald,
  ink: "#060810",
  surface: "#0A0D14",
  card: "#10131A",
  cardElevated: "#161A24",
  text: "#ECEEF4",
  textSecondary: "#7C8799",
  muted: "#4B5563",
  subtle: "#2A3040",
  border: "rgba(255,255,255,0.07)",
  borderLight: "rgba(255,255,255,0.04)",
  overlay: "rgba(0,0,0,0.75)",
  glass: "rgba(255,255,255,0.04)",
  buttonDisabledBg: "#0F1D18",
  shadow: "#000",
  kpiBg: "#0C0F16",
};

export const light = {
  ...palette,
  ...emerald,
  ink: "#FFFFFF",
  surface: "#F5F6F8",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  muted: "#94A3B8",
  subtle: "#CBD5E1",
  border: "rgba(0,0,0,0.07)",
  borderLight: "rgba(0,0,0,0.04)",
  overlay: "rgba(15,23,42,0.5)",
  glass: "rgba(0,0,0,0.03)",
  buttonDisabledBg: "#D1FAE5",
  shadow: "rgba(0,0,0,0.08)",
  kpiBg: "#F9FAFB",
  primary: "#059669",
  primaryLight: "#34D399",
  primaryDim: "rgba(5,150,105,0.07)",
  primaryBorder: "rgba(5,150,105,0.15)",
  primaryMuted: "rgba(5,150,105,0.45)",
  green: "#059669",
  greenDim: "rgba(5,150,105,0.07)",
  greenBorder: "rgba(5,150,105,0.15)",
  red: "#DC2626",
  redDim: "rgba(220,38,38,0.07)",
  redBorder: "rgba(220,38,38,0.15)",
  blue: "#2563EB",
  blueDim: "rgba(37,99,235,0.07)",
  blueBorder: "rgba(37,99,235,0.15)",
  amber: "#D97706",
  amberDim: "rgba(217,119,6,0.07)",
  amberBorder: "rgba(217,119,6,0.15)",
};

export const COLORS = dark;
