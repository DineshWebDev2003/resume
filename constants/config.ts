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
  
  ADMOB_IDS: {
    REWARDED_AD_UNIT_ID: isProd 
      ? "ca-app-pub-2141805169615611/5003708990" 
      : "ca-app-pub-3940256099942544/5224354917", // Test ID
    BANNER_AD_UNIT_ID: isProd 
      ? "ca-app-pub-2141805169615611/8423019767" 
      : "ca-app-pub-3940256099942544/6300978111", // Test ID
  },
  
  SUBSCRIPTION_IDS: {
    MONTHLY: "monthly",
    WEEKLY: "weekly",
  },
};
