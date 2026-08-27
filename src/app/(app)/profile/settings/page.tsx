import { getUser } from "@/lib/data-live";
import { TopBar } from "@/components/shell/TopBar";
import { SettingsForm } from "@/components/profile/SettingsForm";

export default async function SettingsPage() {
  const user = await getUser();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Settings" />
      <div className="px-[18px]">
        <SettingsForm
          initial={{ firstName: user.firstName, lastName: user.lastName, username: user.firstName.toLowerCase(), level: user.explanationLevel }}
          email="Signed-in email"
        />
      </div>
    </div>
  );
}
