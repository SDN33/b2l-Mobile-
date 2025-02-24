import "../global.css";
import { Slot } from "expo-router";
import { SupabaseProvider } from "@/context/supabase-provider";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        // Vos chargements initiaux ici
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      }
    }

    loadResources();
  }, []);

  useEffect(() => {
    if (isReady) {
      // Cache le splash screen seulement quand isReady devient true
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(console.error);
      });
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <SupabaseProvider>
      <Slot />
    </SupabaseProvider>
  );
}