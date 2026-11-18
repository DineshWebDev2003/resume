import { z } from "zod";

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export const submitAtsAnalysisSchema = z.object({
  clientResumeId: z.string().max(128).optional(),
  resumeName: z.string().min(1).max(255),
  fileType: z.string().max(64).optional(),
  fileSize: z.number().int().nonnegative().max(50 * 1024 * 1024).optional(),
  extractedText: z.string().min(1).max(120000), // extracted on-device only; never log
  storeExtractedText: z.boolean().optional().default(false),
  jobTitle: z.string().max(255).optional(),
  company: z.string().max(255).optional(),
  jobDescription: z.string().max(50000).optional(),
  sourceUrl: z.string().url().max(2000).optional().or(z.literal("").transform(() => undefined)),
});

export const upsertResumeRecordSchema = z.object({
  id: z.string().uuid().optional(),
  clientResumeId: z.string().max(128).optional(),
  resumeName: z.string().min(1).max(255),
  fileType: z.string().max(64).optional(),
  fileSize: z.number().int().nonnegative().optional(),
  textExtractionStatus: z.enum(["unknown", "extracted", "failed", "partial"]).optional(),
  extractedText: z.string().max(120000).optional(),
  storeExtractedText: z.boolean().optional().default(false),
});
