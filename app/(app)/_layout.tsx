import { Stack, Tabs } from "expo-router";
import { Session, User } from "@supabase/supabase-js";
import { useRouter, useSegments, SplashScreen } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
import { supabase } from "@/config/supabase";
import { Slot } from "expo-router";

SplashScreen.preventAutoHideAsync();

type SupabaseContextProps = {
  user: User | null;
  session: Session | null;
  initialized?: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type SupabaseProviderProps = {
  children: React.ReactNode;
};

export const SupabaseContext = createContext<SupabaseContextProps>({
  user: null,
  session: null,
  initialized: false,
  signUp: async () => {},
  signInWithPassword: async () => {},
  signOut: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session ? session.user : null);
      setInitialized(true);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session ? session.user : null);
    });
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inProtectedGroup = segments[1] === "(protected)";

    if (session && !inProtectedGroup) {
      router.replace("/(app)/(protected)");
    } else if (!session) {
      router.replace("/(app)/welcome");
    }

    /* HACK: Something must be rendered when determining the initial auth state...
    instead of creating a loading screen, we use the SplashScreen and hide it after
    a small delay (500 ms)
    */

    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
  }, [initialized, session]);

  return (
    <SupabaseContext.Provider
      value={{
        user,
        session,
        initialized,
        signUp,
        signInWithPassword,
        signOut,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export const unstable_settings = {
  initialRouteName: "welcome", // Changed from "sign-in" to "welcome"
};

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
        }
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="modal" />
      <Stack.Screen name="(protected)" />
    </Stack>
  );
}
