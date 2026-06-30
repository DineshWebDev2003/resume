const isProd = !__DEV__;

export const API_CONFIG = {
  ATS_ENGINE_ENDPOINT: "https://api.groq.com/openai/v1/chat/completions",
  GROQ_API_KEY: "YOUR_REMOTE_KEY",
  GROQ_MODEL: "llama-3.3-70b-versatile",

  // Google Gemini (Free Tier)
  GEMINI_API_KEY: "YOUR_REMOTE_KEY",
  GEMINI_MODEL: "gemini-1.5-flash",
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1/models/",

  IS_PRODUCTION: isProd,

  // ── Free Job APIs ─────────────────────────────────────────────────────────
  // Adzuna: 250 free calls/month → sign up at https://developer.adzuna.com
  ADZUNA_APP_ID: "ecc7f430",
  ADZUNA_APP_KEY: "914b56f67a533a7e4fa9cec3ccc4e953",

  // Jobicy: 100% free, no auth – remote jobs worldwide
  JOBICY_ENDPOINT: "https://jobicy.com/api/v2/remote-jobs",

  // Remotive: 100% free, no auth – remote tech jobs
  REMOTIVE_ENDPOINT: "https://remotive.com/api/remote-jobs",

  ADMOB_IDS: {
    REWARDED_AD_UNIT_ID: isProd
      ? "ca-app-pub-2141805169615611/5003708990"
      : "ca-app-pub-3940256099942544/5224354917",
    BANNER_AD_UNIT_ID: isProd
      ? "ca-app-pub-2141805169615611/8423019767"
      : "ca-app-pub-3940256099942544/6300978111",
    INTERSTITIAL_AD_UNIT_ID: isProd
      ? "ca-app-pub-2141805169615611/8423019767"
      : "ca-app-pub-3940256099942544/1033173712",
  },

  SUBSCRIPTION_IDS: {
    MONTHLY: "monthly",
    WEEKLY: "weekly",
  },
};
