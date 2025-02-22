import "../global.css";
import React, { useState } from "react";
import { View, StyleSheet, useWindowDimensions, Text } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
import { SupabaseProvider } from "@/context/supabase-provider";
import Notes from "./(app)/(protected)/index";
import Planning from "./(app)/(protected)/planning";
import Settings from "./(app)/(protected)/settings";
import { Slot } from "expo-router";
import { Stack } from "expo-router";

const renderScene = SceneMap({
  notes: Notes,
  planning: Planning,
  settings: Settings,
});

export default function RootLayout() {
  return (
    <SupabaseProvider>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </SupabaseProvider>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
});
