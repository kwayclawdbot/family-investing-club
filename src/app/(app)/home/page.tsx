import { KaiFab } from "@/components/shell/KaiFab";
import { HomeSwitch } from "@/components/home/HomeSwitch";
import { ClubHome } from "@/components/home/ClubHome";
import { ChildHome } from "@/components/home/ChildHome";
import {
  getClub, clubVisibleMembers, getProposals, getResearch, getClubActivity, getClubPortfolio, getCommunity, getContinueLesson, getLiveSessions, getPortfolio, getChildHome,
} from "@/lib/data";

/** Home v2 — club first (artboard 16); child accounts get the protected composition (artboard 10). */
export default async function HomePage(props: PageProps<"/home">) {
  const sp = await props.searchParams;
  const forceChild = sp.as === "child";
  const [club, proposals, research, activity, portfolio, community, next, sessions, practice, child] = await Promise.all([
    getClub(), getProposals(), getResearch(), getClubActivity(), getClubPortfolio(), getCommunity(), getContinueLesson(), getLiveSessions(), getPortfolio(), getChildHome(),
  ]);
  const proposal = proposals.find((p) => p.status === "open");
  const live = sessions.find((s) => s.status === "live");
  return (
    <>
      <HomeSwitch
        forceChild={forceChild}
        adult={<ClubHome club={club} members={clubVisibleMembers} proposal={proposal} research={research} activity={activity} portfolio={portfolio} community={community} next={next} live={live} practice={practice} />}
        child={<ChildHome data={child} />}
      />
      <KaiFab context="home" />
    </>
  );
}
