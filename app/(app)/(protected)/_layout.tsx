import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View } from 'react-native';
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

export default function ProtectedLayout() {
    const { colorScheme } = useColorScheme();

    return (
        <View style={{ flex: 1, pointerEvents: 'auto' }}>
            <Tabs
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: colorScheme === "dark"
                            ? colors.dark.background
                            : colors.light.background,
                    },
                    tabBarActiveTintColor: colorScheme === "dark"
                        ? colors.dark.foreground
                        : colors.light.foreground,
                    tabBarIcon: ({ color, size }) => {
                        let iconName: keyof typeof Ionicons.glyphMap = "home";

                        if (route.name === "index") {
                            iconName = "document-text-outline";
                        } else if (route.name === "planning") {
                            iconName = "calendar-outline";
                        } else if (route.name === "settings") {
                            iconName = "settings-outline";
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarAnimation: Platform.select({
                        ios: 'default',
                        android: 'none',
                        web: 'none'
                    })
                })}
            >
                <Tabs.Screen name="index" options={{ title: "Notes" }} />
                <Tabs.Screen name="planning" options={{ title: "Planning" }} />
                <Tabs.Screen name="settings" options={{ title: "Réglages" }} />
            </Tabs>
        </View>
    );
}
