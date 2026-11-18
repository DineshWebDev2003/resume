import type { Env } from "./env";

export type AtsAiResult = {
  ats_score: number;
  analysis: any;
  missing_keywords: string[];
  skills_analysis: any;
  improvement_suggestions: any[];
  job_compatibility_score: number;
  model?: string;
};

function clampScore(n: any, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export async function runAtsAnalysis(env: Env, input: { extractedText: string; jobDescription?: string; jobTitle?: string }): Promise<AtsAiResult> {
  if (!env.AI_API_KEY) {
    throw new Error("AI_NOT_CONFIGURED");
  }
  const provider = (env.AI_PROVIDER || "groq").toLowerCase();
  const prompt = `You are an ATS resume analyzer. Return ONLY valid JSON with keys: ats_score (0-100), analysis (object), missing_keywords (string[]), skills_analysis (object), improvement_suggestions (array), job_compatibility_score (0-100).\nJob title: ${input.jobTitle || "N/A"}\nJob description:\n${(input.jobDescription || "").slice(0, 20000)}\nResume text:\n${input.extractedText.slice(0, 40000)}`;

  let text = "";
  if (provider === "groq") {
    const model = env.AI_MODEL || "openai/gpt-oss-120b";
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: "Return strict JSON only." }, { role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`AI_ERROR_${res.status}`);
    const data: any = await res.json();
    text = data?.choices?.[0]?.message?.content || "{}";
  } else if (provider === "gemini") {
    const model = env.AI_MODEL || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.AI_API_KEY)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) throw new Error(`AI_ERROR_${res.status}`);
    const data: any = await res.json();
    text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "{}";
  } else {
    throw new Error("AI_PROVIDER_UNSUPPORTED");
  }

  const cleaned = text.replace(/```json/gi, "```").replace(/```/g, "").trim();
  let parsed: any;
  try { parsed = JSON.parse(cleaned); } catch { parsed = {}; }
  return {
    ats_score: clampScore(parsed.ats_score ?? parsed.score, 0),
    analysis: parsed.analysis ?? parsed,
    missing_keywords: Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords.map(String).slice(0, 100) : [],
    skills_analysis: parsed.skills_analysis ?? {},
    improvement_suggestions: Array.isArray(parsed.improvement_suggestions) ? parsed.improvement_suggestions.slice(0, 50) : [],
    job_compatibility_score: clampScore(parsed.job_compatibility_score ?? parsed.match_score ?? parsed.ats_score, 0),
    model: env.AI_MODEL || env.AI_PROVIDER || "unknown",
  };
}
