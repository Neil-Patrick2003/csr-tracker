import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import SetupScreen from "../screens/SetupScreen";
import OrderQueueScreen from "../screens/OrderQueueScreen";

const Stack = createNativeStackNavigator();

function SetupWrapper({ navigation }) {
  return (
    <SetupScreen
      onSubmit={({ userId, agentName }) =>
        navigation.replace("OrderQueue", { userId, agentName })
      }
    />
  );
}

function AppStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink },
        animation: "fade",
      }}
    >
      <Stack.Screen name="Setup" component={SetupWrapper} />
      <Stack.Screen name="OrderQueue" component={OrderQueueScreen} />
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