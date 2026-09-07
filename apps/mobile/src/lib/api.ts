/**
 * The Next.js app in this repo is the backend. Anything that needs a server — Kai, checkout,
 * push, admin writes — goes through it; plain reads go straight to Supabase under RLS.
 *
 * A 401 gets exactly one retry after a refresh. Without that, a token that expired mid-scroll
 * shows the user an error for something that was only ever a timing problem.
 */
import { getAccessToken, supabase } from "./supabase";

const BASE = process.env.EXPO_PUBLIC_API_BASE ?? "";

export class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = async () => {
    const token = await getAccessToken();
    return fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  };

  let res = await send();
  if (res.status === 401) {
    const { error } = await supabase.auth.refreshSession();
    if (error) await supabase.auth.signOut();
    else res = await send();
  }
  if (!res.ok) throw new ApiError(res.status, (await res.text()).slice(0, 300) || res.statusText);
  return res.json() as Promise<T>;
}
