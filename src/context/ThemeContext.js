import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dark, light } from "../constants/theme";

const THEME_KEY = "@csr_tracker_theme";
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setMode] = useState(system === "light" ? "light" : "dark");
  const [hasUserChoice, setHasUserChoice] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load saved choice once on mount
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (cancelled) return;
      if (saved === "light" || saved === "dark") {
        setMode(saved);
        setHasUserChoice(true);
      } else if (system === "light" || system === "dark") {
        setMode(system);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow system changes only if the user hasn't made an explicit choice
  useEffect(() => {
    if (!hydrated || hasUserChoice) return;
    if (system === "light" || system === "dark") setMode(system);
  }, [system, hydrated, hasUserChoice]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      return next;
    });
    setHasUserChoice(true);
  }, []);

  const colors = useMemo(() => (mode === "dark" ? dark : light), [mode]);

  return (
    <ThemeContext.Provider value={{ colors, mode, toggle, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
