import { API_CONFIG } from '@/constants/config';
import { UserStorage, type PreferredProvider } from './storage';
import { RemoteConfigService } from './remote-config';

export type AIProvider = 'groq' | 'gemini' | 'pollinations' | 'meta-llama';

/**
 * Priority: user keys (primary) → shared/remote keys → free Pollinations tier.
 * Memory of the last successful provider + last errors powers the
 * API Configuration status screen.
 */
type ProviderId = 'groq' | 'gemini' | 'pollinations' | 'meta-llama';
let lastUsedProvider: ProviderId | null = null;
const providerErrors: Partial<Record<ProviderId, string>> = {};

export function getLastUsedProvider(): ProviderId | null {
  return lastUsedProvider;
}

function markSuccess(id: ProviderId) {
  lastUsedProvider = id;
  delete providerErrors[id];
}

function markError(id: ProviderId, e: any) {
  const msg = e?.message || String(e);
  providerErrors[id] = msg.substring(0, 120);
}

const isRealKey = (k?: string | null) => !!k && !k.startsWith('YOUR_');

export interface ProviderLinkStatus {
  id: ProviderId;
  label: string;
  hasUserKey: boolean;
  hasSharedKey: boolean;
  state: 'active' | 'ready' | 'error' | 'unconfigured';
  detail: string;
}

/** Live fallback-chain status for the API Configuration screen. */
export async function getAIProviderStatus(): Promise<ProviderLinkStatus[]> {
  const [userGroq, userGemini, userPolli] = await Promise.all([
    UserStorage.getGroqKey(),
    UserStorage.getGeminiKey(),
    UserStorage.getPollinationsKey(),
  ]);
  const userLlama = await UserStorage.getLlamaKey();
  let remote: { groq_key?: string; gemini_key?: string } = {};
  try {
    remote = await RemoteConfigService.getKeys();
  } catch {}

  const sharedGroq = isRealKey(remote.groq_key) || isRealKey(API_CONFIG.GROQ_API_KEY);
  const sharedGemini = isRealKey(remote.gemini_key) || isRealKey(API_CONFIG.GEMINI_API_KEY);

  const link = (
    id: ProviderId,
    label: string,
    hasUserKey: boolean,
    hasSharedKey: boolean,
  ): ProviderLinkStatus => ({
    id,
    label,
    hasUserKey,
    hasSharedKey,
    state:
      lastUsedProvider === id
        ? 'active'
        : providerErrors[id]
          ? 'error'
          : hasUserKey || hasSharedKey
            ? 'ready'
            : 'unconfigured',
    detail:
      lastUsedProvider === id
        ? 'Active — served the last request ✓'
        : providerErrors[id]
          ? `Last attempt failed: ${providerErrors[id]}`
          : hasUserKey
            ? 'Your key set (primary)'
            : hasSharedKey
              ? 'Shared app key'
              : 'No key configured',
  });

  return [
    link('groq', 'Groq (primary)', isRealKey(userGroq), sharedGroq),
    link('gemini', 'Gemini (fallback 1)', isRealKey(userGemini), sharedGemini),
    link('pollinations', 'Pollinations free tier (fallback 2)', isRealKey(userPolli), false),
    link('meta-llama', 'Meta Llama API (fallback 3)', isRealKey(userLlama), false),
  ];
}

export async function callSecureAI(messages: ChatMessage[], options: { provider?: AIProvider, jsonMode?: boolean } = {}) {
  // Cloud Functions are disabled on Spark plan, using direct AI call instead.
  return await callAI(messages, options);
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function callAI(
  messages: ChatMessage[],
  options: {
    provider?: AIProvider,
    jsonMode?: boolean
  } = {}
) {
  const { jsonMode = true } = options;

  // Explicit provider = caller's strict choice (existing behavior kept).
  if (options.provider) {
    return await callProviderDirect(options.provider, messages, jsonMode);
  }

  // No explicit provider → honor the user's switch (Profile → API Configuration).
  // 'auto' (default) runs the full fallback chain; a selected model is tried
  // first with the rest of the chain as backup so the app keeps working.
  let preferred: PreferredProvider = 'auto';
  try {
    preferred = await UserStorage.getPreferredProvider();
  } catch {}

  if (preferred === 'auto' || preferred === 'groq') {
    return await callGroq(messages, jsonMode); // full chain lives inside
  }

  try {
    return await callProviderDirect(preferred, messages, jsonMode);
  } catch (firstErr) {
    console.log(`Preferred provider ${preferred} failed, falling back to chain...`);
    for (const id of CHAIN_ORDER) {
      if (id === preferred) continue;
      try {
        return await callProviderDirect(id, messages, jsonMode);
      } catch {}
    }
    throw firstErr;
  }
}

const CHAIN_ORDER: ProviderId[] = ['groq', 'gemini', 'pollinations', 'meta-llama'];

async function callProviderDirect(id: ProviderId, messages: ChatMessage[], jsonMode: boolean) {
  switch (id) {
    case 'groq':
      return await callGroq(messages, jsonMode);
    case 'gemini':
      return await callGemini(messages, jsonMode);
    case 'pollinations':
      return await callPollinations(messages, jsonMode);
    case 'meta-llama':
      return await callMetaLlama(messages, jsonMode);
  }
}

async function callGroq(messages: ChatMessage[], jsonMode: boolean) {
  const userKeyStr = await UserStorage.getGroqKey();
  const remoteKeys = await RemoteConfigService.getKeys();
  
  const systemKeys = [remoteKeys.groq_key || API_CONFIG.GROQ_API_KEY];
  const userKeys = userKeyStr ? userKeyStr.split(',').map(k => k.trim()).filter(Boolean) : [];
  
  // Combine keys and shuffle to balance load/credits
  let keysToTry = [...userKeys, ...systemKeys]
    .filter(k => k && !k.startsWith("YOUR_"))
    .sort(() => Math.random() - 0.5);
  
  if (keysToTry.length === 0) {
    throw new Error('No Groq API keys found. Please add one in Profile -> API Config.');
  }

  let lastError = null;
  for (const apiKey of keysToTry) {
    try {
      const response = await fetch(API_CONFIG.ATS_ENGINE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: API_CONFIG.GROQ_MODEL,
          messages: messages,
          temperature: 0.2,
          response_format: jsonMode ? { type: "json_object" } : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        markSuccess('groq');
        return data.choices[0].message.content;
      }
      
      const errorData = await response.text();
      console.log(`Groq Key Failed (${apiKey.substring(0, 8)}...): ${response.status} - ${errorData}`);
      
      if (response.status === 401 || response.status === 403) {
        lastError = new Error("API Key credits exhausted or invalid. Please check your Groq console.");
        continue;
      }
      
      if (response.status === 429) {
        lastError = new Error("Groq Rate Limit (Credits) reached. Please try adding another key in Profile.");
        continue;
      }
      
      lastError = new Error(`Groq Error ${response.status}: ${errorData.substring(0, 50)}`);
    } catch (e) {
      console.log(`Groq Connection Failed for key ${apiKey.substring(0, 8)}...`, e);
      lastError = e;
    }
  }
  
  // If we reach here, all Groq keys failed.
  // Fallback chain: Gemini → free Pollinations tier → Meta Llama API.
  if (lastError) markError('groq', lastError);
  console.log("All Groq keys failed. Falling back to Gemini, Pollinations, Meta Llama...");
  try {
    return await callGemini(messages, jsonMode);
  } catch (geminiErr) {
    try {
      return await callPollinations(messages, jsonMode);
    } catch {
      try {
        return await callMetaLlama(messages, jsonMode);
      } catch {
        throw lastError || new Error('All AI providers (Groq, Gemini, Pollinations & Meta Llama) are currently unavailable.');
      }
    }
  }
}

async function callGemini(messages: ChatMessage[], jsonMode: boolean) {
  const userKeyStr = await UserStorage.getGeminiKey();
  const remoteKeys = await RemoteConfigService.getKeys();
  
  const systemKeys = [remoteKeys.gemini_key || API_CONFIG.GEMINI_API_KEY];
  const userKeys = userKeyStr ? userKeyStr.split(',').map(k => k.trim()).filter(Boolean) : [];
  
  // Try user keys first, then fallback to system keys
  const keysToTry = [...userKeys, ...systemKeys].filter(k => k && !k.startsWith("YOUR_"));

  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  let lastError = null;
  for (const apiKey of keysToTry) {
    if (!apiKey) continue;

    try {
      const url = `${API_CONFIG.GEMINI_ENDPOINT}${API_CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
        })
      });

      if (response.ok) {
        const data = await response.json();
        markSuccess('gemini');
        return data.candidates[0].content.parts[0].text;
      }
      
      const errorData = await response.text();
      console.log(`Gemini Key Failed (${apiKey.substring(0, 8)}...): ${response.status} - ${errorData}`);
      lastError = new Error(`Gemini Error: ${response.status}`);
    } catch (e) {
      console.log(`Gemini Connection Failed for key ${apiKey.substring(0, 8)}...`, e);
      lastError = e;
    }
  }

  if (lastError) markError('gemini', lastError);
  // Last resorts: free Pollinations tier, then Meta Llama API.
  try {
    return await callPollinations(messages, jsonMode);
  } catch {
    return await callMetaLlama(messages, jsonMode);
  }
}

async function callPollinations(messages: ChatMessage[], jsonMode: boolean) {
  const userKey = (await UserStorage.getPollinationsKey())?.trim();
  // Key first (reliable), anonymous once after (currently 402-limited upstream).
  const attempts: (string | null)[] = userKey ? [userKey, null] : [null];
  let lastError: any = null;

  for (const key of attempts) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (key) headers['Authorization'] = `Bearer ${key}`;

      const body: Record<string, any> = {
        model: API_CONFIG.POLLINATIONS_MODEL,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.2,
      };
      if (jsonMode) body.response_format = { type: 'json_object' };

      const response = await fetch(API_CONFIG.POLLINATIONS_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          markSuccess('pollinations');
          return text;
        }
        lastError = new Error('Pollinations returned an empty response.');
        continue;
      }

      const errText = await response.text();
      console.log(
        `Pollinations ${key ? 'key' : 'anonymous'} failed: ${response.status} - ${errText.substring(0, 80)}`,
      );
      lastError =
        response.status === 402
          ? new Error('Pollinations free tier exhausted (HTTP 402) — add a free key in Profile → API Configuration.')
          : new Error(`Pollinations error ${response.status}.`);
    } catch (e) {
      console.log('Pollinations connection failed:', e);
      lastError = e;
    }
  }

  if (lastError) markError('pollinations', lastError);
  throw lastError || new Error('Pollinations unavailable.');
}

/**
 * Meta Llama API (OpenAI-compatible preview). Key-only — skipped silently
 * when the user hasn't pasted one, so the chain never stalls on it.
 */
async function callMetaLlama(messages: ChatMessage[], jsonMode: boolean) {
  const apiKey = (await UserStorage.getLlamaKey())?.trim();
  if (!isRealKey(apiKey)) {
    throw new Error('No Meta Llama key configured (Profile → API Configuration).');
  }

  try {
    const body: Record<string, any> = {
      model: API_CONFIG.LLAMA_MODEL,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.2,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const response = await fetch(API_CONFIG.LLAMA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        markSuccess('meta-llama');
        return text;
      }
      throw new Error('Meta Llama returned an empty response.');
    }

    const errText = await response.text();
    console.log(`Meta Llama failed: ${response.status} - ${errText.substring(0, 80)}`);
    throw new Error(`Meta Llama error ${response.status}.`);
  } catch (e) {
    markError('meta-llama', e);
    throw e;
  }
}

export async function transcribeAudio(uri: string) {
  const userKeyStr = await UserStorage.getGroqKey();
  const remoteKeys = await RemoteConfigService.getKeys();
  
  const systemKeys = [remoteKeys.groq_key || API_CONFIG.GROQ_API_KEY];
  const userKeys = userKeyStr ? userKeyStr.split(',').map(k => k.trim()).filter(Boolean) : [];
  const keysToTry = [...userKeys, ...systemKeys].filter(k => k && !k.startsWith("YOUR_"));

  if (keysToTry.length === 0) {
    throw new Error('No API keys found for transcription.');
  }

  // Create form data for Groq Whisper
  const formData = new FormData();
  // @ts-ignore
  formData.append('file', {
    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
    type: 'audio/m4a',
    name: 'recording.m4a',
  });
  formData.append('model', 'whisper-large-v3');

  for (const apiKey of keysToTry) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.text;
      }
      
      console.log(`Transcription key failed: ${apiKey.substring(0, 8)}...`);
    } catch (e) {
      console.error("Transcription error with key", apiKey.substring(0, 8), e);
    }
  }

  throw new Error('Transcription service failed after trying all keys.');
}

import { Platform } from 'react-native';

