#!/usr/bin/env node
/**
 * Platform-lane smoke (no server, no network, no third-party keys):
 *   1. Stripe HMAC verifier — sign a fake payload with a test secret; assert accept, reject
 *      on wrong secret / tampered body / stale timestamp / missing header.
 *   2. /api/push/dispatch payload validation as a pure function (DB-trigger row shapes).
 *   3. Cron auth (`Authorization: Bearer CRON_SECRET` | ?secret=) as a pure function.
 *
 * Runs the real TypeScript modules via Node's built-in type stripping (Node ≥ 22.6):
 *   node scripts/platform-smoke.mjs
 */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(new URL(".", import.meta.url).pathname, "..");
const mod = (p) => import(pathToFileURL(path.join(root, p)).href);

const { verifyStripeSignature, signStripePayload } = await mod("src/lib/server/stripe-signature.ts");
const { parseNotificationPayload } = await mod("src/lib/server/push-payload.ts");
const { cronAuthorized } = await mod("src/lib/server/cron-auth.ts");

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

console.log("1. Stripe webhook HMAC (stripe-signature.ts)");
const secret = "whsec_test_" + "a".repeat(24);
const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed", data: { object: { id: "cs_test", metadata: { kind: "club_membership" }, amount_total: 9900 } } });
const now = Math.floor(Date.now() / 1000);
const header = signStripePayload(payload, secret, now);
check("accepts a correctly signed payload", () => assert.equal(verifyStripeSignature(payload, header, secret), true));
check("rejects the wrong secret", () => assert.equal(verifyStripeSignature(payload, header, "whsec_other"), false));
check("rejects a tampered body", () => assert.equal(verifyStripeSignature(payload.replace("9900", "1"), header, secret), false));
check("rejects a stale timestamp (> 10 min)", () => assert.equal(verifyStripeSignature(payload, signStripePayload(payload, secret, now - 601), secret), false));
check("accepts inside the tolerance window", () => assert.equal(verifyStripeSignature(payload, signStripePayload(payload, secret, now - 599), secret), true));
check("rejects a missing header", () => assert.equal(verifyStripeSignature(payload, null, secret), false));
check("rejects a malformed header", () => assert.equal(verifyStripeSignature(payload, "t=abc", secret), false));
check("rejects a wrong-length v1 without throwing", () => assert.equal(verifyStripeSignature(payload, `t=${now},v1=deadbeef`, secret), false));

console.log("2. /api/push/dispatch payload validation (push-payload.ts)");
const row = { id: "0b2d5b2a-6a4e-4a5e-9b7c-2f1d3e4c5b6a", user_id: "7d3c1a2b-4e5f-4a6b-8c9d-0e1f2a3b4c5d", actor_id: null, type: "reply", message_id: null, body: "hi", link: "/community", read_at: null, dispatched_at: null, created_at: "2026-08-28T12:00:00Z" };
check("accepts the trigger's bare notification row", () => { const r = parseNotificationPayload(row); assert.equal(r.ok, true); assert.equal(r.row.id, row.id); assert.equal(r.row.type, "reply"); });
check("accepts a pg_net `{ record }` wrapper", () => { const r = parseNotificationPayload({ record: row }); assert.equal(r.ok, true); assert.equal(r.row.user_id, row.user_id); });
check("rejects a body with no id", () => { const r = parseNotificationPayload({ user_id: row.user_id }); assert.equal(r.ok, false); assert.equal(r.error, "bad body"); });
check("rejects a non-uuid id", () => { const r = parseNotificationPayload({ ...row, id: "1; drop table" }); assert.equal(r.ok, false); assert.equal(r.error, "bad id"); });
check("rejects a non-object body", () => assert.equal(parseNotificationPayload("nope").ok, false));
check("defaults body/link when absent", () => { const r = parseNotificationPayload({ id: row.id, user_id: row.user_id, type: "alert" }); assert.equal(r.ok, true); assert.equal(r.row.body, ""); assert.equal(r.row.link, null); });

console.log("3. Cron auth (cron-auth.ts)");
check("accepts Authorization: Bearer <CRON_SECRET>", () => assert.equal(cronAuthorized({ authorization: "Bearer s3cret", secretParam: null }, "s3cret").ok, true));
check("accepts ?secret=<CRON_SECRET>", () => assert.equal(cronAuthorized({ authorization: null, secretParam: "s3cret" }, "s3cret").ok, true));
check("rejects a wrong bearer", () => assert.equal(cronAuthorized({ authorization: "Bearer nope", secretParam: null }, "s3cret").ok, false));
check("rejects an empty ?secret= even when CRON_SECRET is set", () => assert.equal(cronAuthorized({ authorization: null, secretParam: "" }, "s3cret").ok, false));
check("fails closed when CRON_SECRET is unset", () => { const r = cronAuthorized({ authorization: "Bearer ", secretParam: "" }, undefined); assert.equal(r.ok, false); assert.equal(r.error, "CRON_SECRET not configured"); });

console.log(process.exitCode ? `\n${passed} passed, some FAILED` : `\nall ${passed} checks passed`);
