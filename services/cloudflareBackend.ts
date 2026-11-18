import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { API_CONFIG } from "@/constants/config";

type GqlResponse<T> = { data?: T; errors?: Array<{ message: string }> };

function baseUrl() {
  return (API_CONFIG.CLOUDFLARE_API_BASE_URL || "").replace(/\/$/, "");
}

async function getAuthToken(explicit?: string) {
  if (explicit) return explicit;
  const migration = (API_CONFIG as any).CLOUDFLARE_MIGRATION_TOKEN || "";
  if (migration) return migration;
  try {
    if ((API_CONFIG as any).AUTH_PROVIDER === "existing") {
      const { auth } = require("@/services/firebase");
      const user = auth.currentUser;
      if (user?.getIdToken) return await user.getIdToken();
    }
  } catch {}
  return "";
}

async function getDeviceId() {
  try {
    let id = await AsyncStorage.getItem("device_id_v1");
    if (!id) {
      id = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem("device_id_v1", id);
    }
    return id;
  } catch {
    return `${Platform.OS}-unknown`;
  }
}

export function isCloudflareProvider() {
  return API_CONFIG.API_PROVIDER === "cloudflare" && !!baseUrl();
}

export async function cloudflareGraphQL<T>(query: string, variables?: Record<string, unknown>, token?: string): Promise<T> {
  const t = await getAuthToken(token);
  const deviceId = await getDeviceId();
  const res = await axios.post<GqlResponse<T>>(
    `${baseUrl()}/graphql`,
    { query, variables },
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "X-Device-Id": deviceId,
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      timeout: 60000,
    },
  );
  if (res.data?.errors?.length) throw new Error(res.data.errors.map((e) => e.message).join("; "));
  if (!res.data?.data) throw new Error("Empty GraphQL response");
  return res.data.data;
}

export type CloudflareAtsResult = {
  submitAtsAnalysis: {
    report: {
      id: string;
      atsScore: number | null;
      analysis: any;
      missingKeywords: any;
      skillsAnalysis: any;
      improvementSuggestions: any;
      jobCompatibilityScore: number | null;
      createdAt: string;
    };
    resumeRecord?: { id: string; clientResumeId?: string | null; resumeName: string } | null;
    jobDescriptionId?: string | null;
  };
};

/** No-R2: sends device-extracted text only (never resume binary). */
export async function submitAtsAnalysisToCloudflare(input: {
  extractedText: string;
  resumeName: string;
  fileType?: string;
  fileSize?: number;
  clientResumeId?: string;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  storeExtractedText?: boolean;
}) {
  const mutation = `
    mutation SubmitAtsAnalysis($input: SubmitAtsAnalysisInput!) {
      submitAtsAnalysis(input: $input) {
        report {
          id atsScore jobCompatibilityScore createdAt
          analysis missingKeywords skillsAnalysis improvementSuggestions
        }
        resumeRecord { id clientResumeId resumeName }
        jobDescriptionId
      }
    }
  `;
  return cloudflareGraphQL<CloudflareAtsResult>(mutation, { input });
}
