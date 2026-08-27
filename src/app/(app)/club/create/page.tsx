import { getClub } from "@/lib/data-live";
import { CreateClub } from "@/components/club/CreateClub";

export default async function CreateClubPage() {
  const club = await getClub();
  return <CreateClub defaults={club} />;
}
