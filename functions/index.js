const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

/**
 * SECURE AI SYNTHESIS
 * This function calls the AI API (Groq/Gemini) securely.
 * API Keys are stored in Firebase Secret Manager or Environment Variables.
 */
exports.generateResume = functions.https.onCall(async (data, context) => {
  // 1. Authenticate user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can generate resumes."
    );
  }

  const { messages, jsonMode = true, provider = "groq" } = data;

  try {
    // 2. Access Secure API Keys (Stored in Cloud Functions Config)
    // You should set these using: firebase functions:config:set groq.key="YOUR_KEY"
    const GROQ_API_KEY = functions.config().groq?.key || "YOUR_FALLBACK_KEY";
    const GEMINI_API_KEY = functions.config().gemini?.key || "YOUR_FALLBACK_KEY";

    if (provider === "groq") {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-70b-versatile",
          messages: messages,
          temperature: 0.2,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
        }
      );
      return { content: response.data.choices[0].message.content };
    } else {
      // Gemini Implementation
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await axios.post(url, { contents });
      return { content: response.data.candidates[0].content.parts[0].text };
    }
  } catch (error) {
    console.error("Cloud Function AI Error:", error.response?.data || error.message);
    throw new functions.https.HttpsError("internal", "AI Synthesis failed.");
  }
});

/**
 * VALIDATE BILLING & SUBSCRIPTION
 * Updates user profile in Firestore after a successful Google Play Purchase.
 */
exports.syncUserSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated");

  const { purchaseToken, productId } = data;
  const uid = context.auth.uid;

  // In production, you would verify the token with Google Play Developer API here.
  
  await admin.firestore().collection("users").doc(uid).set({
    isPro: true,
    lastPurchaseToken: purchaseToken,
    subscriptionTier: productId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { success: true, message: "Subscription synced successfully." };
});

/**
 * FETCH DYNAMIC TEMPLATES
 * Returns the list of resume templates stored in Firestore.
 */
exports.getTemplates = functions.https.onCall(async (data, context) => {
  const snapshot = await admin.firestore().collection("templates").get();
  const templates = [];
  snapshot.forEach((doc) => {
    templates.push({ id: doc.id, ...doc.data() });
  });
  return { templates };
});

/**
 * AUTO APPLY ORCHESTRATION (extension — client remains the primary runner)
 *
 * Safety rules enforced here and on the client:
 * - Only runs when users/{uid}/autoApplySettings/config has enabled=true
 *   and paused=false (explicit opt-in; default OFF).
 * - Never submits to external job sites. No CAPTCHA bypass, no credential
 *   use, no bot automation. External listings resolve to
 *   "Manual Apply Required" with the official application URL.
 * - Only marks eligible in-app ("internal") postings as "Auto Apply Queued";
 *   the user still submits in the official form. Nothing is ever reported
 *   as "Applied" unless a supported submission actually happened.
 */
exports.processAutoApplyQueue = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated");
  }

  const uid = context.auth.uid;
  const db = admin.firestore();

  const settingsSnap = await db
    .collection("users")
    .doc(uid)
    .collection("autoApplySettings")
    .doc("config")
    .get();

  const settings = settingsSnap.exists ? settingsSnap.data() : {};
  if (!settings.enabled || settings.paused) {
    return { processed: 0, reason: "Auto Apply is off or paused." };
  }

  const minMatch =
    typeof settings.minMatch === "number" ? settings.minMatch : 70;

  // Promote over-threshold "Matched" docs to "Auto Apply Queued" so the
  // client (or a future approved integration) can act on them.
  // Cap the batch for safety.
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("applications")
    .where("status", "==", "Matched")
    .limit(20)
    .get();

  let queued = 0;
  const batch = db.batch();
  snapshot.forEach((docSnap) => {
    const app = docSnap.data();
    if ((app.matchScore || 0) >= minMatch) {
      batch.set(
        docSnap.ref,
        {
          status: "Auto Apply Queued",
          statusColor: "#f59e0b",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      queued += 1;
    }
  });
  if (queued > 0) await batch.commit();

  return { processed: snapshot.size, queued };
});
