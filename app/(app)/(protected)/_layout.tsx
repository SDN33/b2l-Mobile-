import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

export default function ProtectedLayout() {
    const { colorScheme } = useColorScheme();

    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor:
                        colorScheme === "dark"
                            ? colors.dark.background
                            : colors.light.background,
                },
                tabBarActiveTintColor:
                    colorScheme === "dark"
                        ? colors.dark.foreground
                        : colors.light.foreground,
                tabBarShowLabel: false,
                tabBarIcon: ({ color, size }) => {
                    let iconName: "home" | "settings" = "home";

                    if (route.name === "index") {
                        iconName = "home";
                    } else if (route.name === "settings") {
                        iconName = "settings";
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tabs.Screen name="index" options={{ title: "Accueil" }} />
            <Tabs.Screen name="settings" options={{ title: "Réglages" }} />
        </Tabs>
    );
}
