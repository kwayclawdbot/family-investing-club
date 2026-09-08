/**
 * Supabase for React Native.
 *
 * supabase-js only runs its refresh timer on native while `startAutoRefresh()` is active — nothing
 * calls it for you, so a one-hour access token dies silently and every screen starts failing with
 * no route back to sign-in. That is the "login expired" dead end this app must never ship. The
 * wiring here is day-one, not a later fix: auto-refresh tied to AppState, a proactive refresh
 * before expiry, and a sign-out fallback so the root gate can route to sign-in.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) throw new Error("EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY missing — see .env.example");

export const supabase = createClient(url, anon, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Native has no URL bar to read a magic-link fragment from; Expo Router handles the deep link.
    detectSessionInUrl: Platform.OS === "web",
  },
});

if (Platform.OS !== "web") {
  supabase.auth.startAutoRefresh();
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Refresh when the token is inside its last two minutes, rather than after it has already died. */
const REFRESH_WINDOW_S = 120;

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;
  const expiresIn = (session.expires_at ?? 0) - Math.floor(Date.now() / 1000);
  if (expiresIn > REFRESH_WINDOW_S) return session.access_token;
  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error || !refreshed.session) {
    // A dead refresh token is a sign-out, not a message. The gate sends them to sign-in.
    await supabase.auth.signOut();
    return null;
  }
  return refreshed.session.access_token;
}
