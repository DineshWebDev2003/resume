import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./context";
import { paginationSchema, submitAtsAnalysisSchema, upsertResumeRecordSchema } from "../lib/validation";
import { createAtsReport, createJobDescription, createOrUpdateResumeRecord, ensureAppProfile, getAtsReport, getEntitlements, getResumeRecord, getUsage, incrementUsage, isPremiumEmail, listAtsReports, listResumeRecords, nowIso } from "../lib/db";
import { runAtsAnalysis } from "../lib/ai";

function requireAuth(ctx: GraphQLContext): string {
  if (!ctx.userId) throw new GraphQLError("Authentication required", { extensions: { code: "UNAUTHENTICATED" } });
  return ctx.userId;
}
function parseJson(value: string | null): unknown {
  if (value == null) return null;
  try { return JSON.parse(value); } catch { return value; }
}
const mapResumeRecord = (r: any) => r ? ({
  id: r.id, clientResumeId: r.client_resume_id, resumeName: r.resume_name, fileType: r.file_type,
  fileSize: r.file_size, textExtractionStatus: r.text_extraction_status, createdAt: r.created_at, updatedAt: r.updated_at,
}) : null;
const mapAtsReport = (r: any) => r ? ({
  id: r.id, resumeRecordId: r.resume_record_id, jobDescriptionId: r.job_description_id, atsScore: r.ats_score,
  analysis: parseJson(r.analysis_json), missingKeywords: parseJson(r.missing_keywords_json),
  skillsAnalysis: parseJson(r.skills_analysis_json), improvementSuggestions: parseJson(r.improvement_suggestions_json),
  jobCompatibilityScore: r.job_compatibility_score, createdAt: r.created_at,
}) : null;

async function sha256Hex(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export const resolvers = {
  Query: {
    health: () => "ok",
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) return null;
      const user = (ctx as any).user;
      const ent = await ensureAppProfile(ctx.env.DB, ctx.userId, user?.email, user?.name);
      return { id: ctx.userId, email: ent.email, name: user?.name ?? null, isPro: ent.isPro, isPremium: ent.isPremium, resumeLimit: ent.resumeLimit, plan: ent.plan };
    },
    atsReport: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return mapAtsReport(await getAtsReport(ctx.env.DB, userId, args.id));
    },
    atsReports: async (_: unknown, args: { limit?: number; offset?: number }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const { limit, offset } = paginationSchema.parse(args);
      return (await listAtsReports(ctx.env.DB, userId, limit, offset)).map(mapAtsReport);
    },
    resumeRecord: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      return mapResumeRecord(await getResumeRecord(ctx.env.DB, userId, args.id));
    },
    resumeRecords: async (_: unknown, args: { limit?: number; offset?: number }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const { limit, offset } = paginationSchema.parse(args);
      return (await listResumeRecords(ctx.env.DB, userId, limit, offset)).map(mapResumeRecord);
    },
    usageStatus: async (_: unknown, args: { periodKey?: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const periodKey = args.periodKey || new Date().toISOString().slice(0, 7);
      const row = await getUsage(ctx.env.DB, userId, periodKey);
      return { periodKey, atsRequestsCount: row?.ats_requests_count ?? 0, aiTokensEstimate: row?.ai_tokens_estimate ?? 0 };
    },
  },
  Mutation: {
    upsertResumeRecord: async (_: unknown, args: { input: any }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const input = upsertResumeRecordSchema.parse(args.input);
      const id = input.id || crypto.randomUUID();
      const extracted_text = input.storeExtractedText ? (input.extractedText || null) : null;
      const row = await createOrUpdateResumeRecord(ctx.env.DB, {
        id, user_id: userId, client_resume_id: input.clientResumeId, resume_name: input.resumeName,
        file_type: input.fileType, file_size: input.fileSize, text_extraction_status: input.textExtractionStatus || "extracted",
        extracted_text_hash: input.extractedText ? await sha256Hex(input.extractedText) : null,
        extracted_text,
      });
      return mapResumeRecord(row);
    },

    submitAtsAnalysis: async (_: unknown, args: { input: any }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const input = submitAtsAnalysisSchema.parse(args.input);
      const user = (ctx as any).user;
      const ent = await ensureAppProfile(ctx.env.DB, userId, user?.email, user?.name);
      const periodKey = new Date().toISOString().slice(0, 10);
      const usage = await getUsage(ctx.env.DB, userId, periodKey);
      const premium = ent.isPremium || isPremiumEmail(user?.email);
      if (!premium && (usage?.ats_requests_count ?? 0) >= 20) {
        throw new GraphQLError("Daily ATS limit reached", { extensions: { code: "RATE_LIMITED" } });
      }

      const resumeRecordId = crypto.randomUUID();
      const resumeRecord = await createOrUpdateResumeRecord(ctx.env.DB, {
        id: resumeRecordId,
        user_id: userId,
        client_resume_id: input.clientResumeId,
        resume_name: input.resumeName,
        file_type: input.fileType,
        file_size: input.fileSize,
        text_extraction_status: "extracted",
        extracted_text_hash: await sha256Hex(input.extractedText),
        extracted_text: input.storeExtractedText ? input.extractedText : null,
      });

      let jobDescriptionId: string | null = null;
      if (input.jobDescription) {
        jobDescriptionId = crypto.randomUUID();
        await createJobDescription(ctx.env.DB, {
          id: jobDescriptionId, user_id: userId, title: input.jobTitle, company: input.company,
          source_url: input.sourceUrl, description_text: input.jobDescription,
        });
      }

      let ai: any;
      try {
        ai = await runAtsAnalysis(ctx.env, { extractedText: input.extractedText, jobDescription: input.jobDescription, jobTitle: input.jobTitle });
      } catch (e: any) {
        if (e?.message === "AI_NOT_CONFIGURED") {
          throw new GraphQLError("AI not configured on server", { extensions: { code: "AI_NOT_CONFIGURED" } });
        }
        throw new GraphQLError("ATS analysis failed", { extensions: { code: "AI_ERROR" } });
      }

      const report = await createAtsReport(ctx.env.DB, {
        id: crypto.randomUUID(),
        user_id: userId,
        resume_record_id: resumeRecordId,
        job_description_id: jobDescriptionId,
        ats_score: ai.ats_score,
        analysis_json: ai.analysis,
        missing_keywords_json: ai.missing_keywords,
        skills_analysis_json: ai.skills_analysis,
        improvement_suggestions_json: ai.improvement_suggestions,
        job_compatibility_score: ai.job_compatibility_score,
      });
      await incrementUsage(ctx.env.DB, userId, periodKey, 1, 0);

      return { report: mapAtsReport(report), resumeRecord: mapResumeRecord(resumeRecord), jobDescriptionId };
    },
  },
  JSON: {
    serialize: (v: unknown) => v,
    parseValue: (v: unknown) => v,
  },
};
