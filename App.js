import "./global.css";
import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="light" hidden />
    </>
  );
}