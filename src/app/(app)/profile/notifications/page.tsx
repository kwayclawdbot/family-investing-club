import { getNotifications } from "@/lib/data-live";
import { TopBar } from "@/components/shell/TopBar";
import { Inbox } from "@/components/profile/Inbox";

export default async function NotificationsPage() {
  const items = await getNotifications();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Notifications" />
      <div className="px-[18px]"><Inbox items={items} /></div>
    </div>
  );
}
