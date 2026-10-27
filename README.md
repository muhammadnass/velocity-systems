# Velocity Systems — Official Website

Production-ready, fully responsive website for **Velocity Systems** — hybrid (online/offline) software solutions, enterprise microservices, and smart-home automation — with secure **Paystack** checkout for fixed-price service packages.

**Owner:** Muhammad Sanusi Nasir
**Contact:** +234 913 272 6410 · sunusinasir@gmail.com

### 🚀 One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/velocity-systems&env=PAYSTACK_SECRET_KEY&envDescription=Paystack%20secret%20key%20for%20webhook%20verification&envLink=https://dashboard.paystack.com/%23/settings/developers)

> Replace `YOUR_USERNAME` in the button link (in this README) with your GitHub
> username once the repo is pushed. See **"Deploy to Vercel"** below for the
> full walkthrough.

---

## ✨ Features

- Responsive across phones, tablets, laptops, and 4K displays (mobile-first).
- Light / dark theme toggle (remembers the visitor's choice).
- Animated hero, service pricing cards, process timeline, about & contact sections.
- **Paystack Inline checkout** — a branded modal collects Full Name, Email, and Phone, then opens Paystack prefilled with the selected service and exact Naira price.
- Success modal showing the transaction reference and kickoff instructions.
- Accessible: semantic HTML, keyboard-friendly modals, skip link, reduced-motion support.
- Optional lightweight **Express backend** for secure Paystack webhook verification.

---

## 📁 Project Structure

```
velocity-systems/
├── index.html                  # Semantic markup: hero, services, about, contact, modals
├── css/
│   └── styles.css              # Design system, responsive layout, themes, animations
├── js/
│   └── app.js                  # Menu, theme, modals, validation, Paystack integration
├── assets/
│   ├── logo.svg                # Primary logo (light backgrounds)
│   ├── logo-white.svg          # Logo for dark backgrounds / footer
│   ├── logo-mark.svg           # Icon-only mark
│   ├── logo.png                # Raster logo export
│   ├── favicon.png
│   └── apple-touch-icon.png
├── api/                        # Vercel serverless functions (deploy to Vercel = live backend)
│   ├── webhook.js              #   POST /webhook   — Paystack HMAC-SHA512 verification
│   └── verify.js               #   GET  /verify/:ref — server-side transaction check
├── server.js                   # Same backend as a standalone Express app (local / VPS / Render)
├── .github/
│   └── workflows/validate.yml  # CI: syntax-checks every push & PR
├── package.json
├── .nvmrc                      # Pins Node 20
├── .env.example                # Environment variable template
├── vercel.json                 # Vercel config + route rewrites for /webhook & /verify
├── netlify.toml                # Netlify config
└── README.md
```

> **Two interchangeable backends, one codebase:** `api/*` runs automatically on
> Vercel (no server to manage); `server.js` is the identical logic as a portable
> Express app for local dev, a VPS, or Render. Pick whichever host you deploy to.

---

## 🔑 Step 1 — Add your Paystack keys

1. Create a free account at **https://paystack.com** and open
   **Dashboard → Settings → API Keys & Webhooks**.
2. **Public key (front-end):** open `js/app.js` and replace the placeholder:

   ```js
   PAYSTACK_PUBLIC_KEY: "pk_live_your_real_public_key_here",
   ```

   > While the key is still the `pk_test_xxxx…` placeholder, the checkout runs in a
   > **safe simulation mode** so you can test the UI without charging anyone.

3. **Secret key (backend, optional):** copy the env template and fill it in:

   ```bash
   cp .env.example .env
   # then edit .env and set PAYSTACK_SECRET_KEY=sk_live_...
   ```

---

## 💻 Step 2 — Run locally on Ubuntu (VS Code)

Make sure **Node.js 18+** is installed (`node -v`). Then, from the project folder:

```bash
# Install dependencies (for the optional Express server)
npm install

# Start the server (serves the site + webhook endpoint)
npm start
```

Open **http://localhost:3000** in your browser.

### Prefer a pure static preview (no backend)?

Any static server works — for example:

```bash
npm run serve        # uses `npx serve`
# or
python3 -m http.server 3000
```

Then open **http://localhost:3000**. The site is fully functional as static files;
the Express server is only needed for automated webhook verification.

> **VS Code tip:** install the *Live Server* extension, right-click `index.html`,
> and choose **"Open with Live Server"** for instant hot-reload during development.

---

## 🔔 Step 3 — (Optional) Paystack webhook verification

The Express server exposes **`POST /webhook`**. It reads the raw request body,
recomputes an **HMAC-SHA512** using your `PAYSTACK_SECRET_KEY`, and compares it
(constant-time) with the `x-paystack-signature` header before trusting the event.

The same verification runs two ways — pick one:

- **On Vercel (easiest):** `api/webhook.js` is live automatically once deployed.
  Just set `PAYSTACK_SECRET_KEY` in the Vercel dashboard.
- **On any Node host (Render/VPS):** run `server.js`, which exposes the identical
  `/webhook` route.

Then:

1. In the Paystack Dashboard → **Settings → Webhooks**, set the **Webhook URL** to
   `https://your-app.vercel.app/webhook` (or your own domain).
2. On a verified `charge.success` event, fulfil the order where the `TODO` comment
   sits — in `api/webhook.js` (Vercel) or `server.js` (Express): save to a DB,
   email the client, notify your team, trigger kickoff.

There is also a helper route **`GET /verify/:reference`** to confirm a single
transaction server-side via the Paystack REST API.

---

## 🚀 Step 4 — Deploy

### Option A — GitHub + Vercel (recommended, free, one-click)

This repo is pre-configured so Vercel deploys the **static site _and_ the
serverless webhook** together, with zero build setup.

**1. Push to GitHub**

```bash
# From inside the project folder (git is already initialised with a first commit)
git remote add origin https://github.com/YOUR_USERNAME/velocity-systems.git
git branch -M main
git push -u origin main
```

> No repo yet? Create an empty one at **github.com/new** named
> `velocity-systems` (don't add a README/license), then run the commands above.
> If you prefer the GitHub CLI: `gh repo create velocity-systems --public --source=. --push`.

**2. Import into Vercel**

- Go to **vercel.com → Add New → Project**, pick the `velocity-systems` repo, and
  click **Deploy** (Framework Preset: *Other* — detected automatically).
- Or use the **Deploy with Vercel** button at the top of this README after
  swapping in your GitHub username.

**3. Add your secret key**

In **Vercel → Project → Settings → Environment Variables** add:

| Key                   | Value                              |
|-----------------------|------------------------------------|
| `PAYSTACK_SECRET_KEY` | `sk_live_...` (or `sk_test_...`)   |

Redeploy once so the variable is picked up. Your live endpoints are then:

- Webhook: `https://your-app.vercel.app/webhook`
- Verify:  `https://your-app.vercel.app/verify/REFERENCE`

**4. Every future `git push` to `main` auto-deploys.** Pull requests get their
own preview URL automatically.

> Still set your **public** key in `js/app.js` (that one lives in the browser).

### Option B — Netlify (free)

- Drag-and-drop the whole project folder onto **app.netlify.com/drop**, **or**
- Connect the repo at **netlify.com**. `netlify.toml` is already included
  (publish directory = project root, no build step).

### Option C — Render (free, runs the Express backend too)

1. Push the project to GitHub.
2. On **render.com → New → Web Service**, pick the repo.
3. **Build command:** `npm install` · **Start command:** `npm start`.
4. Add `PAYSTACK_SECRET_KEY` under **Environment**.

> **Vercel runs the webhook for you** via `api/*` serverless functions — no
> separate host needed. **Netlify** serves the static site but won't run
> `server.js`; for a live webhook on Netlify use a Netlify Function, or use
> Vercel/Render instead.

---

## 🌐 Step 5 — Connect your custom `.com` domain later

1. Buy the domain (Namecheap, GoDaddy, Google Domains, etc.).
2. In your host's dashboard (Vercel/Netlify/Render) → **Domains → Add domain**.
3. Point your domain's DNS records (A / CNAME) to the values the host shows you.
4. HTTPS/SSL is issued automatically. Done.

---

## 🛠️ Customisation quick-reference

| What to change            | Where                                             |
|---------------------------|---------------------------------------------------|
| Brand colours             | `css/styles.css` → `:root` variables              |
| Service names & prices    | `index.html` → `.price-card` + `data-amount`      |
| Paystack public key       | `js/app.js` → `CONFIG.PAYSTACK_PUBLIC_KEY`        |
| Contact details           | `index.html` (contact & footer sections)          |
| Logo                      | replace files in `assets/`                        |

> Prices use the `data-amount` attribute in **Naira**; the app converts to kobo
> (×100) automatically before sending to Paystack.

---

© Velocity Systems. Built for Muhammad Sanusi Nasir.
