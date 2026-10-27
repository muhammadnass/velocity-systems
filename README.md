# Velocity Systems — Official Website

Production-ready, fully responsive website for **Velocity Systems** — hybrid (online/offline) software solutions, enterprise microservices, and smart-home automation — with secure **Paystack** checkout for fixed-price service packages.

**Owner:** Muhammad Sanusi Nasir
**Contact:** +234 913 272 6410 · sunusinasir@gmail.com

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
├── index.html            # Semantic markup: hero, services, about, contact, modals
├── css/
│   └── styles.css        # Design system, responsive layout, themes, animations
├── js/
│   └── app.js            # Menu, theme, modals, validation, Paystack integration
├── assets/
│   ├── logo.svg          # Primary logo (light backgrounds)
│   ├── logo-white.svg    # Logo for dark backgrounds / footer
│   ├── logo-mark.svg     # Icon-only mark
│   ├── logo.png          # Raster logo export
│   ├── favicon.png
│   └── apple-touch-icon.png
├── server.js             # Optional Express server + /webhook HMAC verification
├── package.json
├── .env.example          # Environment variable template
├── vercel.json           # Vercel config
├── netlify.toml          # Netlify config
└── README.md
```

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

To use it:

1. Deploy the server somewhere that runs Node (Render, Railway, a VPS, etc.).
2. In the Paystack Dashboard, set the **Webhook URL** to
   `https://your-domain.com/webhook`.
3. On a verified `charge.success` event, fulfil the order inside the
   `charge.success` case in `server.js` (save to a DB, email the client, notify
   your team — the hook-points are marked with `TODO`).

There is also a helper route **`GET /verify/:reference`** to confirm a single
transaction server-side via the Paystack REST API.

---

## 🚀 Step 4 — Deploy

### Option A — Vercel (recommended, free)

```bash
npm install -g vercel
vercel          # follow the prompts; accept defaults
vercel --prod   # deploy to production
```

Or connect the GitHub repo at **vercel.com → New Project**. `vercel.json` is
already included.

### Option B — Netlify (free)

- Drag-and-drop the whole project folder onto **app.netlify.com/drop**, **or**
- Connect the repo at **netlify.com**. `netlify.toml` is already included
  (publish directory = project root, no build step).

### Option C — Render (free, runs the Express backend too)

1. Push the project to GitHub.
2. On **render.com → New → Web Service**, pick the repo.
3. **Build command:** `npm install` · **Start command:** `npm start`.
4. Add `PAYSTACK_SECRET_KEY` under **Environment**.

> **Static hosts (Vercel/Netlify) serve the site perfectly**, but they don't run
> `server.js`. Use **Render** (or any Node host) if you need the live `/webhook`.

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
