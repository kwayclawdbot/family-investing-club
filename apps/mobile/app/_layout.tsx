import "@/global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import {
  useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from "@expo-google-fonts/nunito";
import { SessionProvider, useSession } from "@/src/state/session";

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * The gate. Signed out members can only be at /sign-in; signed in members can never be.
 *
 * Note what this does NOT do: it does not return null while fonts load. A font gate that unmounts
 * the tree is a known way to end up with a web build whose buttons do nothing, so the splash screen
 * covers the wait instead and the tree stays mounted throughout.
 */
function Gate() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const atDoor = segments[0] === "sign-in";
    if (!session && !atDoor) router.replace("/sign-in");
    else if (session && atDoor) router.replace("/");
  }, [session, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FAF3E5" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="lesson/[id]" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsReady] = useFonts({
    Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
  });

  useEffect(() => { if (fontsReady) SplashScreen.hideAsync().catch(() => {}); }, [fontsReady]);

  return (
    <GluestackUIProvider mode="light">
      <SafeAreaProvider>
        <SessionProvider>
          <StatusBar style="dark" />
          <Gate />
        </SessionProvider>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
