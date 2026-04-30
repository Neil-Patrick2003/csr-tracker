import { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import SetupScreen from "../screens/SetupScreen";
import DashboardScreen from "../screens/DashboardScreen";
import CallLogsScreen from "../screens/CallLogsScreen";

const Stack = createNativeStackNavigator();
const USER_KEY = "@csr_tracker_user";

function SetupWrapper({ navigation }) {
  return (
    <SetupScreen
      onSubmit={async ({ userId, agentName }) => {
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
        setInitialRoute("Setup");
      }
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.ink }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
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
      <Stack.Screen name="Setup" component={SetupWrapper} />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={savedParams}
      />
      <Stack.Screen name="CallLogs" component={CallLogsScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppStack />
      </NavigationContainer>
    </ThemeProvider>
  );
}
