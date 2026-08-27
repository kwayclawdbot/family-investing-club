import { redirect } from "next/navigation";
/** Members now live in the club workspace tab. */
export default function ClubMembersPage() {
  redirect("/club?tab=members");
}
