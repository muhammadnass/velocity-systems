/**
 * Vercel Serverless Function — Verify a single transaction
 * Route (via vercel.json rewrite): GET /verify/:reference -> /api/verify?reference=:reference
 * Also callable directly: GET /api/verify?reference=VS-ABC123
 *
 * Confirms a payment server-side using Paystack's REST API, so your front-end
 * never has to trust a client-reported status.
 */

const https = require("https");

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ error: "Server not configured with a secret key." });
  }

  const reference = (req.query && req.query.reference) || "";
  if (!reference) {
    return res.status(400).json({ error: "Missing ?reference parameter." });
  }

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/transaction/verify/" + encodeURIComponent(reference),
    method: "GET",
    headers: { Authorization: "Bearer " + secret }
  };

  const psReq = https.request(options, function (psRes) {
    let body = "";
    psRes.on("data", function (chunk) { body += chunk; });
    psRes.on("end", function () {
      try {
        const parsed = JSON.parse(body);
        const d = parsed.data || {};
        res.status(200).json({
          verified: d.status === "success",
          reference: d.reference || reference,
          amount: d.amount ? d.amount / 100 : null,
          currency: d.currency || null,
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
};
