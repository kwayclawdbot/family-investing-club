import { getUser } from "@/lib/data-live";
import { LearnV12 } from "@/components/learn/v12/LearnV12";
export default async function LearnPage() { const u = await getUser(); return <LearnV12 streak={u.streakDays} />; }
