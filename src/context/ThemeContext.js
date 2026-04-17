import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { dark, light } from "../constants/theme";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("dark");

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const colors = useMemo(() => (mode === "dark" ? dark : light), [mode]);

  return (
    <ThemeContext.Provider value={{ colors, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}