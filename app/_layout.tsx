import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

import "../global.css";
import React from "react";
import { SupabaseProvider } from "@/context/supabase-provider";
import { Stack } from "expo-router";
import { useColorScheme } from '@/lib/useColorScheme';

export default function RootLayout() {
  // Move hooks to the top level
  const { colorScheme } = useColorScheme();

  // Move useEffect inside the component
  useEffect(() => {
    LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
  }, []);

  // Return your layout configuration
  return (
    <SupabaseProvider>
      <Stack
        screenOptions={{
          headerShown: false,
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
