import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { tokens } from "@/src/theme/tokens";

/** Three surfaces and a profile. Everything the club does is one of these; there is no fifth thing. */
const icon = (d: string) => function TabIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={String(color)} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const LearnIcon = icon("M12 5.5C10 4 7 4 4.5 4.5v15C7 19 10 19 12 20.5c2-1.5 5-1.5 7.5-1v-15C17 4 14 4 12 5.5zM12 5.5v15");
const PicksIcon = icon("M3 17l5-6 4 3.5L21 6M21 6h-5M21 6v5");
const CommunityIcon = icon("M16 19v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 17.5V19M10 10.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5M20 19v-1.5a3.5 3.5 0 00-2.6-3.4M15.5 4.2a3.25 3.25 0 010 6.3");

function ProfileIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.6} stroke={String(color)} strokeWidth={2.2} />
      <Path d="M4.5 20a7.5 7.5 0 0115 0" stroke={String(color)} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.green,
        tabBarInactiveTintColor: tokens.ink4,
        tabBarStyle: { backgroundColor: tokens.nav, borderTopColor: tokens.line2, borderTopWidth: 1, height: 84, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: "Nunito_800ExtraBold", fontSize: 10.5, letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Learn", tabBarIcon: LearnIcon }} />
      <Tabs.Screen name="picks" options={{ title: "Picks", tabBarIcon: PicksIcon }} />
      <Tabs.Screen name="community" options={{ title: "Club", tabBarIcon: CommunityIcon }} />
      <Tabs.Screen name="profile" options={{ title: "You", tabBarIcon: ProfileIcon }} />
    </Tabs>
  );
}
