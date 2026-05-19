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
