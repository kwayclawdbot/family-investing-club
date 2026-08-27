import { getFaqs } from "@/lib/data";
import { TopBar } from "@/components/shell/TopBar";
import { HelpCenter } from "@/components/profile/HelpCenter";

export default async function HelpPage() {
  const faqs = await getFaqs();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Help & support" />
      <div className="px-[18px]"><HelpCenter faqs={faqs} /></div>
    </div>
  );
}
