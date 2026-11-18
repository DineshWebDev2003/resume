export type Env = {
  DB: D1Database;
  RESUME_BUCKET?: R2Bucket;
  ENVIRONMENT?: string;
  API_PROVIDER_DEFAULT?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  FIREBASE_PROJECT_ID?: string;
  AI_PROVIDER?: string;
  AI_API_KEY?: string;
  AI_MODEL?: string;
  R2_ENABLED?: string;
  // Optional migration testing only (must be disabled in production).
  MIGRATION_BEARER_TOKEN?: string;
  MIGRATION_USER_ID?: string;
};
