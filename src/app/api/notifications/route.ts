import { NextResponse } from "next/server";
import { requireSession } from "@/lib/live/route-utils";
import { getNotificationsDetailed, unreadCount } from "@/lib/live/notifications";

/** The member's notifications (FTA `notifications`, own rows) + unread count. */
export async function GET() {
  const r = await requireSession(); if (r.error) return r.error;
  const [items, unread] = await Promise.all([getNotificationsDetailed(), unreadCount()]);
  return NextResponse.json({ ok: true, items: items ?? [], unread });
}
