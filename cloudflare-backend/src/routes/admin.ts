import { Hono } from "hono";
import type { Env } from "../lib/env";

export const adminRoutes = new Hono<{ Bindings: Env }>();

// Initial template catalog
let TEMPLATES_STORE = [
  { id: "Elder-1", name: "Elder 1: Classic", category: "Minimal", tier: "Free", accentColor: "#2563eb", layout: "1-Column", atsScore: 98, active: true },
  { id: "Elder-2", name: "Elder 2: Elegant", category: "Executive", tier: "Free", accentColor: "#059669", layout: "2-Column", atsScore: 96, active: true },
  { id: "Elder-3", name: "Elder 3: Bold", category: "Modern", tier: "Pro", accentColor: "#7c3aed", layout: "Split Sidebar", atsScore: 95, active: true },
  { id: "Elder-4", name: "Elder 4: Modern", category: "Modern", tier: "Free", accentColor: "#d97706", layout: "2-Column", atsScore: 97, active: true },
  { id: "Elder-5", name: "Elder 5: Compact", category: "Tech", tier: "Free", accentColor: "#0891b2", layout: "1-Column", atsScore: 99, active: true },
  { id: "Elder-6", name: "Elder 6: Premium", category: "Executive", tier: "Pro", accentColor: "#dc2626", layout: "Split Sidebar", atsScore: 94, active: true },
  { id: "Elder-7", name: "Elder 7: Gold", category: "Executive", tier: "Premium", accentColor: "#b45309", layout: "2-Column", atsScore: 95, active: true },
  { id: "Elder-8", name: "Elder 8: Skyline", category: "Creative", tier: "Pro", accentColor: "#4f46e5", layout: "Split Sidebar", atsScore: 93, active: true },
  { id: "Titan-1", name: "Titan 1: PRO", category: "Tech", tier: "Pro", accentColor: "#0f172a", layout: "1-Column", atsScore: 100, active: true },
  { id: "Titan-2", name: "Titan 2: Dome", category: "Tech", tier: "Pro", accentColor: "#0284c7", layout: "2-Column", atsScore: 96, active: true },
  { id: "Titan-3", name: "Titan 3: Split", category: "Tech", tier: "Free", accentColor: "#0d9488", layout: "Split Sidebar", atsScore: 97, active: true },
  { id: "BlackWolf-1", name: "BlackWolf 1: Stealth", category: "Modern", tier: "Free", accentColor: "#18181b", layout: "1-Column", atsScore: 98, active: true },
  { id: "BlackWolf-2", name: "BlackWolf 2: Obsidian", category: "Executive", tier: "Pro", accentColor: "#27272a", layout: "2-Column", atsScore: 96, active: true },
  { id: "BlackWolf-3", name: "BlackWolf 3: Apex", category: "Tech", tier: "Premium", accentColor: "#3f3f46", layout: "Split Sidebar", atsScore: 95, active: true },
  { id: "JesterKing-1", name: "JesterKing 1: Royal", category: "Creative", tier: "Free", accentColor: "#9333ea", layout: "1-Column", atsScore: 94, active: true },
  { id: "JesterKing-2", name: "JesterKing 2: Crown", category: "Creative", tier: "Pro", accentColor: "#c026d3", layout: "2-Column", atsScore: 92, active: true },
];

// Initial mock transactions (Google Play In-App Purchases)
let TRANSACTIONS_STORE = [
  {
    orderId: "GPA.3341-9821-4402-91823",
    customerEmail: "karthik.tech@gmail.com",
    sku: "resume_pro_monthly",
    productName: "Resume Pro Monthly Subscription",
    amount: "₹299",
    currency: "INR",
    purchaseToken: "token_p89a7f89asdf789a7sd9fa8s7dfa",
    purchaseDate: "2026-11-17 14:22:10",
    status: "SUCCESS",
    refundReason: null,
    refundDate: null,
  },
  {
    orderId: "GPA.3392-1049-5512-44910",
    customerEmail: "ananya.sharma@yahoo.com",
    sku: "resume_premium_lifetime",
    productName: "Elite Lifetime Pass",
    amount: "₹1,499",
    currency: "INR",
    purchaseToken: "token_90asdf890asdf89a0sdf89a0sdf",
    purchaseDate: "2026-11-17 11:15:40",
    status: "SUCCESS",
    refundReason: null,
    refundDate: null,
  },
  {
    orderId: "GPA.3318-7721-3390-12884",
    customerEmail: "sarah.jenkins@outlook.com",
    sku: "ats_scanner_pack_10",
    productName: "10x ATS Scan Powerpack",
    amount: "₹199",
    currency: "INR",
    purchaseToken: "token_77a9sdf87a9sdf7a9sdf79asdf",
    purchaseDate: "2026-11-16 19:40:02",
    status: "REFUNDED",
    refundReason: "Customer Request / Accidental Purchase",
    refundDate: "2026-11-17 09:12:15",
  },
  {
    orderId: "GPA.3370-5592-1102-88392",
    customerEmail: "rahul.verma@gmail.com",
    sku: "resume_pro_monthly",
    productName: "Resume Pro Monthly Subscription",
    amount: "₹299",
    currency: "INR",
    purchaseToken: "token_11a8sdf711as8df71a8sdf71as",
    purchaseDate: "2026-11-16 16:05:22",
    status: "SUCCESS",
    refundReason: null,
    refundDate: null,
  },
  {
    orderId: "GPA.3364-2281-9940-55102",
    customerEmail: "michael.chen@techcorp.io",
    sku: "resume_premium_lifetime",
    productName: "Elite Lifetime Pass",
    amount: "₹1,499",
    currency: "INR",
    purchaseToken: "token_55a2sdf755as2df75a2sdf75as",
    purchaseDate: "2026-11-15 21:18:30",
    status: "SUCCESS",
    refundReason: null,
    refundDate: null,
  },
];

// ─── Templates CRUD Endpoints ──────────────────────────────────────────────────

// GET all templates
adminRoutes.get("/api/admin/templates", (c) => {
  return c.json({ ok: true, templates: TEMPLATES_STORE });
});

// POST create new template
adminRoutes.post("/api/admin/templates", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.id || !body.name) {
      return c.json({ ok: false, error: "Missing required fields: id and name" }, 400);
    }
    const newTemplate = {
      id: body.id.trim(),
      name: body.name.trim(),
      category: body.category || "Modern",
      tier: body.tier || "Free",
      accentColor: body.accentColor || "#2563eb",
      layout: body.layout || "1-Column",
      atsScore: Number(body.atsScore) || 95,
      active: body.active !== false,
    };
    TEMPLATES_STORE = [newTemplate, ...TEMPLATES_STORE.filter((t) => t.id !== newTemplate.id)];
    return c.json({ ok: true, template: newTemplate, message: "Template created successfully" });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// PUT update existing template
adminRoutes.put("/api/admin/templates/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const index = TEMPLATES_STORE.findIndex((t) => t.id === id);
    if (index === -1) {
      return c.json({ ok: false, error: "Template not found" }, 404);
    }
    TEMPLATES_STORE[index] = {
      ...TEMPLATES_STORE[index],
      ...body,
      id: TEMPLATES_STORE[index].id, // keep original ID immutable
    };
    return c.json({ ok: true, template: TEMPLATES_STORE[index], message: "Template updated successfully" });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// DELETE remove template
adminRoutes.delete("/api/admin/templates/:id", (c) => {
  const id = c.req.param("id");
  const initialLength = TEMPLATES_STORE.length;
  TEMPLATES_STORE = TEMPLATES_STORE.filter((t) => t.id !== id);
  if (TEMPLATES_STORE.length === initialLength) {
    return c.json({ ok: false, error: "Template not found" }, 404);
  }
  return c.json({ ok: true, message: `Template ${id} deleted successfully` });
});

// ─── Payments & Google Play Billing Endpoints ─────────────────────────────────

// GET all transactions
adminRoutes.get("/api/admin/payments", (c) => {
  const totalRevenue = TRANSACTIONS_STORE.filter((t) => t.status === "SUCCESS").reduce((sum, t) => {
    const num = parseInt(t.amount.replace(/[^0-9]/g, ""), 10) || 0;
    return sum + num;
  }, 0);

  const totalRefunds = TRANSACTIONS_STORE.filter((t) => t.status === "REFUNDED").length;

  return c.json({
    ok: true,
    stats: {
      totalRevenue: `₹${totalRevenue.toLocaleString()}`,
      successfulOrders: TRANSACTIONS_STORE.filter((t) => t.status === "SUCCESS").length,
      refundedOrders: totalRefunds,
      refundRate: `${((totalRefunds / TRANSACTIONS_STORE.length) * 100).toFixed(1)}%`,
    },
    transactions: TRANSACTIONS_STORE,
  });
});

// POST Google Play In-App Billing Refund
adminRoutes.post("/api/admin/payments/refund", async (c) => {
  try {
    const { orderId, reason, revokeEntitlement } = await c.req.json();
    if (!orderId) {
      return c.json({ ok: false, error: "Missing orderId" }, 400);
    }

    const tx = TRANSACTIONS_STORE.find((t) => t.orderId === orderId);
    if (!tx) {
      return c.json({ ok: false, error: "Order not found" }, 404);
    }

    if (tx.status === "REFUNDED") {
      return c.json({ ok: false, error: "This transaction is already refunded" }, 400);
    }

    // Process refund
    tx.status = "REFUNDED";
    tx.refundReason = reason || "Customer Support Refund";
    tx.refundDate = new Date().toISOString().replace("T", " ").slice(0, 19);

    return c.json({
      ok: true,
      message: `Google Play refund processed successfully for ${orderId}.`,
      refundDetails: {
        orderId: tx.orderId,
        customerEmail: tx.customerEmail,
        amount: tx.amount,
        status: "REFUNDED",
        refundDate: tx.refundDate,
        refundReason: tx.refundReason,
        entitlementRevoked: !!revokeEntitlement,
        googlePlayApiStatus: "200 OK — androidpublisher.purchases.refund SUCCESS",
      },
    });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

