import { useState, useEffect, useRef } from "react";
import { View, Text, Image, Animated, Easing } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { ToastProvider } from "../components/Toast";
import { FONT } from "../constants/theme";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import CallLogsScreen from "../screens/CallLogsScreen";
import HelpScreen from "../screens/HelpScreen";

const APP_ICON = require("../assets/images/icon.png");

function SplashScreen() {
  const { colors } = useTheme();
  const iconScale = useRef(new Animated.Value(0.72)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(16)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(tagOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ transform: [{ scale: iconScale }], opacity: iconOpacity }}>
        <Image source={APP_ICON} style={{ width: 88, height: 88, borderRadius: 22 }} />
      </Animated.View>

      <Animated.Text
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textY }],
          color: colors.text,
          fontFamily: FONT.mono,
          fontSize: 26,
          fontWeight: "700",
          letterSpacing: -0.6,
          marginTop: 20,
        }}
      >
        CallSync
      </Animated.Text>

      <Animated.Text
        style={{
          opacity: tagOpacity,
          color: colors.muted,
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: 1.4,
          marginTop: 6,
        }}
      >
        CSR & RMO TRACKER
      </Animated.Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();
const USER_KEY = "@csr_tracker_user";

function WelcomeWrapper({ navigation }) {
  return (
    <WelcomeScreen
      onGetStarted={() => navigation.navigate("Login")}
    />
  );
}

function LoginWrapper({ navigation }) {
  return (
    <LoginScreen
      onLogin={async ({ userId, agentName }) => {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify({ userId, agentName }));
        navigation.replace("Dashboard", { userId, agentName });
      }}
    />
  );
}

function AppStack() {
  const { colors } = useTheme();
  const [initialRoute, setInitialRoute] = useState(null);
  const [savedParams, setSavedParams] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY).then((value) => {
      if (value) {
        setSavedParams(JSON.parse(value));
        setInitialRoute("Dashboard");
      } else {
        setInitialRoute("Welcome");
      }
    });
  }, []);

  if (!initialRoute) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink },
        animation: "fade",
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeWrapper} />
      <Stack.Screen name="Login" component={LoginWrapper} />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={savedParams}
      />
      <Stack.Screen name="CallLogs" component={CallLogsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <NavigationContainer>
            <AppStack />
          </NavigationContainer>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
