import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { AuthShell } from "@/components/auth/AuthShell";

export default function AuthErrorPage() {
  return (
    <AuthShell backHref="/welcome" title="That link expired" sub="Email links are single-use and only last about an hour. No harm done — get a fresh one."
      footer={<>Need help? <Link href="/profile/help" className="text-green font-extrabold">Contact support</Link></>}>
      <div className="flex flex-col gap-3">
        <ButtonLink href="/forgot-password" full>Send a new password link</ButtonLink>
        <ButtonLink href="/login" full variant="secondary">Sign in instead</ButtonLink>
      </div>
    </AuthShell>
  );
}
