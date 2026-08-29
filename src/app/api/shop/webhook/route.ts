import { NextRequest, NextResponse } from "next/server";
import { createOrderFromSession, attemptFulfillment } from "@/lib/server/shop";
import { verifyStripeSignature } from "@/lib/server/stripe-signature";
import { notConfigured, notConfiguredResponse } from "@/lib/server/env";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook for the SHOP lane only. Verifies the signature manually (same
 * HMAC pattern as the membership webhook) against SHOP_STRIPE_WEBHOOK_SECRET.
 *
 * Stripe fans every event out to every endpoint, so this handler ONLY acts on
 * checkout.session.completed events carrying metadata.kind==='shop'. Everything
 * else is acknowledged (200) and skipped — membership checkouts never create an
 * order here, and shop checkouts are guarded out of the membership webhook.
 */
// PORTED-VERBATIM from fta-dashboard-v3 src/app/api/shop/webhook/route.ts — signature check shared via @/lib/server/stripe-signature.

export async function POST(req: NextRequest) {
  const secret = process.env.SHOP_STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return notConfigured("SHOP_STRIPE_WEBHOOK_SECRET");
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret))
    return NextResponse.json({ error: "bad signature" }, { status: 400 });

  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed")
    return NextResponse.json({ received: true, skipped: "not_checkout_completed" });

  const session = event.data?.object ?? {};
  if (session.metadata?.kind !== "shop")
    return NextResponse.json({ received: true, skipped: "not_shop" });

  const productId: string | undefined = session.metadata?.product_id;
  const quantity = Number(session.metadata?.quantity) || 1;
  if (!productId)
    return NextResponse.json({ received: true, skipped: "no_product_id" });

  try {
    const { orderId } = await createOrderFromSession({ session, productId, quantity });
    // Fulfillment is best-effort — degrades to 'awaiting_fulfillment_setup'
    // when Lulu isn't wired up. Never 500 on a fulfillment hiccup: the order
    // row is the durable record and the admin can retry.
    await attemptFulfillment(orderId).catch((e) =>
      console.error("shop fulfillment error:", orderId, e)
    );
    return NextResponse.json({ received: true, orderId });
  } catch (e) {
    const nc = notConfiguredResponse(e);
    if (nc) return nc;
    console.error("shop webhook order error:", e);
    return NextResponse.json({ error: "order create failed" }, { status: 500 });
  }
}
