import { Platform } from "react-native";

export const FONT = {
  mono: Platform.OS === "ios" ? "Menlo" : "monospace",
};

const emerald = {
  primary: "#10B981",
  primaryLight: "#6EE7B7",
  primaryDim: "rgba(16,185,129,0.08)",
  primaryBorder: "rgba(16,185,129,0.18)",
  primaryMuted: "rgba(16,185,129,0.50)",
};

const palette = {
  green: "#10B981",
  greenDim: "rgba(16,185,129,0.08)",
  greenBorder: "rgba(16,185,129,0.18)",
  red: "#EF4444",
  redDim: "rgba(239,68,68,0.08)",
  redBorder: "rgba(239,68,68,0.18)",
  blue: "#3B82F6",
  blueDim: "rgba(59,130,246,0.08)",
  blueBorder: "rgba(59,130,246,0.18)",
  amber: "#F59E0B",
  amberDim: "rgba(245,158,11,0.08)",
  amberBorder: "rgba(245,158,11,0.18)",
};

export const dark = {
  ...palette,
  ...emerald,
  ink: "#080A0E",
  surface: "#0C0F14",
  card: "#111318",
  cardElevated: "#16191F",
  text: "#E8EAF0",
  textSecondary: "#7E8A9A",
  muted: "#4B5563",
  subtle: "#2A3040",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.035)",
  overlay: "rgba(0,0,0,0.72)",
  glass: "rgba(255,255,255,0.03)",
  buttonDisabledBg: "#142420",
  shadow: "#000",
  kpiBg: "#0E1118",
};

export const light = {
  ...palette,
  ...emerald,
  ink: "#FFFFFF",
  surface: "#F3F4F6",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  muted: "#94A3B8",
  subtle: "#CBD5E1",
  border: "rgba(0,0,0,0.06)",
  borderLight: "rgba(0,0,0,0.03)",
  overlay: "rgba(15,23,42,0.5)",
  glass: "rgba(0,0,0,0.02)",
  buttonDisabledBg: "#D1FAE5",
  shadow: "rgba(0,0,0,0.06)",
  kpiBg: "#F9FAFB",
  primary: "#059669",
  primaryLight: "#34D399",
  primaryDim: "rgba(5,150,105,0.06)",
  primaryBorder: "rgba(5,150,105,0.14)",
  primaryMuted: "rgba(5,150,105,0.45)",
  green: "#059669",
  greenDim: "rgba(5,150,105,0.06)",
  greenBorder: "rgba(5,150,105,0.14)",
  red: "#DC2626",
  redDim: "rgba(220,38,38,0.06)",
  redBorder: "rgba(220,38,38,0.14)",
  blue: "#2563EB",
  blueDim: "rgba(37,99,235,0.06)",
  blueBorder: "rgba(37,99,235,0.14)",
  amber: "#D97706",
  amberDim: "rgba(217,119,6,0.06)",
  amberBorder: "rgba(217,119,6,0.14)",
};

export const COLORS = dark;