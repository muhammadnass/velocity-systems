/**
 * Vercel Serverless Function — Paystack Webhook
 * Route (via vercel.json rewrite): POST /webhook  ->  /api/webhook
 *
 * Verifies the authenticity of incoming Paystack events by recomputing an
 * HMAC-SHA512 of the RAW request body with your PAYSTACK_SECRET_KEY and
 * comparing it (constant-time) against the `x-paystack-signature` header.
 *
 * Set PAYSTACK_SECRET_KEY in the Vercel dashboard:
 *   Project → Settings → Environment Variables
 */

const crypto = require("crypto");

// Read the raw body ourselves. We intentionally never touch `req.body`, so the
// platform does not consume/re-serialize the stream before we hash it — the
// HMAC must be computed over the exact bytes Paystack signed.
function readRawBody(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    req.on("data", function (c) { chunks.push(c); });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("[webhook] PAYSTACK_SECRET_KEY is not set.");
    return res.status(500).end();
  }

  const signature = req.headers["x-paystack-signature"];
  let raw;
  try {
    raw = await readRawBody(req);
  } catch (e) {
    return res.status(400).end();
  }
  if (!signature || !raw || !raw.length) {
    return res.status(400).end();
  }

  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
  const sig = String(signature);
  const valid =
    expected.length === sig.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));

  if (!valid) {
    console.warn("[webhook] Invalid signature — request rejected.");
    return res.status(401).end();
  }

  // Signature verified — acknowledge immediately so Paystack doesn't retry.
  res.status(200).end();

  // Process the (trusted) event.
  let event;
  try {
    event = JSON.parse(raw.toString("utf8"));
  } catch (e) {
    return;
  }

  switch (event && event.event) {
    case "charge.success": {
      const d = event.data || {};
      console.log(
        "[webhook] ✅ Payment success:",
        d.reference,
        (d.currency || "NGN"),
        (Number(d.amount || 0) / 100).toLocaleString(),
        (d.customer && d.customer.email) || ""
      );
      // TODO: fulfil the order — save to DB, email the client, notify your team,
      // trigger project kickoff, etc.
      break;
    }
    case "charge.failed":
      console.log("[webhook] ❌ Payment failed:", event.data && event.data.reference);
      break;
    default:
      console.log("[webhook] ℹ️  Event received:", event && event.event);
  }
};

// Tell Next-style platforms not to pre-parse the body. Harmlessly ignored by
// plain Vercel functions (we read the raw stream above regardless).
module.exports.config = { api: { bodyParser: false } };
