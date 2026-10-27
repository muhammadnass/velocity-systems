/**
 * ============================================================
 * VELOCITY SYSTEMS — Lightweight Express Server
 * ------------------------------------------------------------
 *  • Serves the static website (index.html, css, js, assets)
 *  • Exposes POST /webhook to verify Paystack events via
 *    HMAC-SHA512 signature (x-paystack-signature)
 *  • Optional POST /verify/:reference to confirm a transaction
 *    server-side using the Paystack REST API
 *
 *  This backend is OPTIONAL. The site works as a pure static
 *  deploy (Netlify / Vercel static). Run the server only when
 *  you want automated, trustworthy payment verification.
 * ============================================================
 */

const express = require("express");
const crypto = require("crypto");
const path = require("path");
const https = require("https");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

/* ------------------------------------------------------------
   IMPORTANT: the webhook route needs the RAW request body to
   compute a valid HMAC. We capture the raw buffer here, before
   express.json() reparses it, and only for /webhook.
------------------------------------------------------------ */
app.use(
  "/webhook",
  express.json({
    verify: function (req, _res, buf) {
      req.rawBody = buf;
    }
  })
);

// Normal JSON parsing for the rest of the API
app.use(express.json());

/* ------------------------------------------------------------
   Serve the static front-end from the project root.
------------------------------------------------------------ */
app.use(express.static(path.join(__dirname), { extensions: ["html"] }));

/* ------------------------------------------------------------
   Health check
------------------------------------------------------------ */
app.get("/health", function (_req, res) {
  res.json({ status: "ok", service: "velocity-systems", time: new Date().toISOString() });
});

/* ============================================================
   PAYSTACK WEBHOOK
   Paystack POSTs events here. We verify authenticity by
   recomputing the HMAC-SHA512 of the raw body using our SECRET
   key and comparing it (constant-time) to the signature header.
============================================================ */
app.post("/webhook", function (req, res) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error("[webhook] PAYSTACK_SECRET_KEY is not set.");
    return res.sendStatus(500);
  }

  const signature = req.headers["x-paystack-signature"];
  if (!signature || !req.rawBody) {
    console.warn("[webhook] Missing signature or raw body.");
    return res.sendStatus(400);
  }

  const expected = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest("hex");

  // Constant-time comparison to avoid timing attacks
  const valid =
    expected.length === String(signature).length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));

  if (!valid) {
    console.warn("[webhook] Invalid signature — request rejected.");
    return res.sendStatus(401);
  }

  // Signature verified — acknowledge immediately (within Paystack's timeout)
  res.sendStatus(200);

  // Then process the event asynchronously
  const event = req.body;
  switch (event && event.event) {
    case "charge.success": {
      const d = event.data || {};
      console.log(
        "[webhook] ✅ Payment success:",
        d.reference,
        "| " + (d.currency || "NGN"),
        (Number(d.amount || 0) / 100).toLocaleString(),
        "| " + (d.customer && d.customer.email)
      );
      // TODO: fulfil the order here — save to DB, email the client,
      // notify your team, trigger project kickoff, etc.
      break;
    }
    case "charge.failed":
      console.log("[webhook] ❌ Payment failed:", event.data && event.data.reference);
      break;
    default:
      console.log("[webhook] ℹ️  Event received:", event && event.event);
  }
});

/* ============================================================
   OPTIONAL: Verify a single transaction by reference
   (server-side confirmation using Paystack's REST API)
   Usage: GET /verify/VS-ABC123
============================================================ */
app.get("/verify/:reference", function (req, res) {
  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ error: "Server not configured with a secret key." });
  }

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/transaction/verify/" + encodeURIComponent(req.params.reference),
    method: "GET",
    headers: { Authorization: "Bearer " + PAYSTACK_SECRET_KEY }
  };

  const psReq = https.request(options, function (psRes) {
    let body = "";
    psRes.on("data", function (chunk) { body += chunk; });
    psRes.on("end", function () {
      try {
        const parsed = JSON.parse(body);
        const d = parsed.data || {};
        res.json({
          verified: d.status === "success",
          reference: d.reference,
          amount: d.amount ? d.amount / 100 : null,
          currency: d.currency,
          customer: d.customer ? d.customer.email : null,
          paidAt: d.paid_at || null
        });
      } catch (err) {
        res.status(502).json({ error: "Could not parse Paystack response." });
      }
    });
  });

  psReq.on("error", function () {
    res.status(502).json({ error: "Could not reach Paystack." });
  });
  psReq.end();
});

/* ------------------------------------------------------------
   SPA / static fallback — serve index.html for unknown routes
------------------------------------------------------------ */
app.get("*", function (_req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, function () {
  console.log("🚀 Velocity Systems running at http://localhost:" + PORT);
  if (!PAYSTACK_SECRET_KEY) {
    console.log("⚠️  PAYSTACK_SECRET_KEY not set — webhook verification is disabled.");
  }
});
