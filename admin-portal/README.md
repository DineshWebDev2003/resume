# Resume Studio — Cloudflare Pages Admin Portal

This is a standalone, production-ready Admin Dashboard built for **Cloudflare Pages**.

## Features Included
1. **Resume Templates CRUD Management**:
   - Create, Read, Update, Delete & Toggle Active/Draft state for all resume templates.
   - Live category, layout, tier (Free/Pro/Premium), and ATS score target management.
   - Live color picker and layout mockup.
2. **Payments & Google Play In-App Billing Management**:
   - Live transactions table with Google Play Order IDs (`GPA.xxxx-xxxx-xxxx-xxxxx`).
   - One-click Google Play Billing Refund modal with reason codes and entitlement revocation.
   - Financial KPIs (Gross Revenue, Successful Orders, Refund Rate).
   - CSV export for accounting and customer support.
3. **Zero-Build Deployment**:
   - Pure HTML5 + Tailwind CSS + Lucide Icons + LocalStorage sync.
   - Automatically persistent in the browser and ready to connect to your Cloudflare Worker backend (`cloudflare-backend/src/routes/admin.ts`).

---

## How to Deploy to Cloudflare Pages

### Option A: Using Wrangler CLI (Recommended)
From your terminal:
```bash
npx wrangler pages deploy admin-portal --project-name resume-admin-portal
```

### Option B: Cloudflare Dashboard (Drag & Drop)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages**.
2. Select **Upload assets**.
3. Drag and drop the `admin-portal` folder.
4. Click **Deploy site**! Your admin portal will be live on `https://resume-admin-portal.pages.dev`.

### Option C: Connect via GitHub
1. Push this repository to GitHub.
2. Connect your repo in Cloudflare Pages.
3. Set **Build output directory** to: `admin-portal`
4. Leave **Build command** empty.
5. Deploy!

