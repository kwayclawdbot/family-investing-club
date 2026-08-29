import { Avatar, cx } from "@/components/ui";

/** Household avatar: the uploaded picture when it's a real URL, otherwise the coloured initial. */
export function MemberAvatar({ name, color, avatarUrl, size = 32, className }: { name: string; color?: string; avatarUrl?: string | null; size?: number; className?: string }) {
  if (avatarUrl && /^https?:\/\//.test(avatarUrl)) {
    // eslint-disable-next-line @next/next/no-img-element -- member uploads live on Supabase storage, not an optimised domain
    return <img src={avatarUrl} alt="" width={size} height={size} className={cx("rounded-full object-cover shrink-0 bg-paper-2", className)} style={{ width: size, height: size }} />;
  }
  return <Avatar name={name} color={color} size={size} className={className} />;
}
