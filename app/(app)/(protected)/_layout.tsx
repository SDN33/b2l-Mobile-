import { Tabs } from "expo-router";
import { Platform, View } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

export default function ProtectedLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <View style={{ flex: 1, pointerEvents: 'box-none' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colorScheme === "dark"
              ? colors.dark.background
              : colors.light.background,
            pointerEvents: 'auto'
          },
          tabBarActiveTintColor: colorScheme === "dark"
            ? colors.dark.foreground
            : colors.light.foreground,
          // Disable animations on web platform
          animation: Platform.OS === 'web' ? 'none' : 'fade',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Notes",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="planning"
          options={{
            title: "Planning",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Réglages",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
