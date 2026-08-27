import "server-only";
import { getSession } from "./session";

export type DataMode = "live" | "demo";

/** Live when a signed-in session exists; demo (fixtures) otherwise. */
export async function dataMode(): Promise<DataMode> {
  return (await getSession()) ? "live" : "demo";
}
