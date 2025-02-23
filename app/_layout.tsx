import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

import "../global.css";
import React from "react";
import { SceneMap } from "react-native-tab-view";
import { SupabaseProvider } from "@/context/supabase-provider";
import Notes from "./(app)/(protected)/index";
import Planning from "./(app)/(protected)/planning";
import Settings from "./(app)/(protected)/settings";
import { Stack } from "expo-router";

// Optionally suppress the animation warning if you're only targeting web
useEffect(() => {
  LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
}, []);

const renderScene = SceneMap({
  index: Notes,
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
