import { brokerages } from "@/lib/data";
import { BrokerageConnect } from "@/components/verify/BrokerageConnect";

const flag = (v: string | string[] | undefined) => (v === "1" ? true : v === "0" ? false : undefined);

export default async function BrokeragePage(props: PageProps<"/profile/brokerage">) {
  const sp = await props.searchParams;
  return <BrokerageConnect brokerages={brokerages} connected={flag(sp.connected)} from={typeof sp.from === "string" ? sp.from : undefined} />;
}
