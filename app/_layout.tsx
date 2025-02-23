import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

import "../global.css";
import React from "react";
import { SupabaseProvider } from "@/context/supabase-provider";
import { Stack } from "expo-router";
import { useColorScheme } from '@/lib/useColorScheme';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
  }, []);

  return (
    <SupabaseProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' // Changed from shadow props to boxShadow
          },
        }}
      >
        <Stack.Screen
          name="(app)"
          options={{
            headerShown: false
          }}
        />
      </Stack>
    </SupabaseProvider>
  );
}
