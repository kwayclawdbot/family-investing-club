import { TopBar } from "@/components/shell/TopBar";
import { EmptyState } from "@/components/ui/extras";
import { getProfileSettings } from "@/lib/live/family";
import { SettingsLive } from "./SettingsLive";

/** Settings on the real `profiles` row: display name, username, avatar (community-media), explanation level, notification prefs, password. */
export default async function SettingsPage() {
  const me = await getProfileSettings();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Settings" />
      <div className="px-[18px]">
        {me ? <SettingsLive me={me} /> : <EmptyState emoji="⚙️" title="Sign in to edit your settings" body="Your name, avatar, notifications and password live here." action="Sign in" href="/login?next=/profile/settings" />}
      </div>
    </div>
  );
}
