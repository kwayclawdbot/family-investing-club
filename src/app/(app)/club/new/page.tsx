import { getCompanies } from "@/lib/data";
import { SubHeader } from "@/components/club/SubHeader";
import { IdeaComposer } from "@/components/club/IdeaComposer";

export default async function NewIdeaPage() {
  const companies = await getCompanies();
  return (
    <>
      <SubHeader backHref="/club" title="New investment idea" />
      <IdeaComposer companies={companies} />
    </>
  );
}
