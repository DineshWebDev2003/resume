import { API_CONFIG } from '@/constants/config';
import { UserStorage, type PreferredProvider } from './storage';
import { RemoteConfigService } from './remote-config';

export type AIProvider = 'groq' | 'gemini' | 'openrouter' | 'cerebras' | 'mistral' | 'deepseek' | 'together' | 'pollinations' | 'meta-llama';

/**
 * Priority: user keys (primary with auto-rotation) → shared/remote keys → free Pollinations tier.
 * Memory of the last successful provider + last errors powers the
 * API Configuration status screen.
 */
type ProviderId = 'groq' | 'gemini' | 'openrouter' | 'cerebras' | 'mistral' | 'deepseek' | 'together' | 'pollinations' | 'meta-llama';
let lastUsedProvider: ProviderId | null = null;
/** Index into [GROQ_MODEL, ...GROQ_FALLBACK_MODELS] — advances permanently on 404. */
let groqModelIdx = 0;
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

/** Live test ping for any provider key to verify quota & validity */
export async function testProviderKey(
  provider: string,
  keyInput: string
): Promise<{ success: boolean; message: string; quotaAvailable: boolean }> {
  const keys = UserStorage.parseMultiKeys(keyInput);
  if (keys.length === 0) {
    return { success: false, message: 'Please paste or enter at least one valid key.', quotaAvailable: false };
  }

  const primaryKey = keys[0];

  try {
    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${primaryKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
      });
      if (res.ok) {
        return { success: true, message: `Key active & ready! (${keys.length} key${keys.length > 1 ? 's' : ''} detected)`, quotaAvailable: true };
      }
      if (res.status === 429) {
        return { success: false, message: 'Rate limit / quota exhausted (429). Auto-rotation ready.', quotaAvailable: false };
      }
      if (res.status === 401 || res.status === 403) {
        return { success: false, message: 'Invalid API Key / Unauthorized.', quotaAvailable: false };
      }
      return { success: false, message: `Groq error HTTP ${res.status}`, quotaAvailable: false };
    }

    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${primaryKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'hi' }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
        }
      );
      if (res.ok) {
        return { success: true, message: `Gemini active & quota ready! (${keys.length} key${keys.length > 1 ? 's' : ''})`, quotaAvailable: true };
      }
      if (res.status === 429) {
        return { success: false, message: 'Gemini free quota exhausted (429 RESOURCE_EXHAUSTED).', quotaAvailable: false };
      }
      if (res.status === 400 || res.status === 403) {
        return { success: false, message: 'Invalid Gemini API key.', quotaAvailable: false };
      }
      return { success: false, message: `Gemini HTTP ${res.status}`, quotaAvailable: false };
    }

    if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${primaryKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
      });
      if (res.ok) {
        return { success: true, message: `OpenRouter active! (${keys.length} key${keys.length > 1 ? 's' : ''})`, quotaAvailable: true };
      }
      return { success: false, message: `OpenRouter HTTP ${res.status}`, quotaAvailable: false };
    }

    if (provider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${primaryKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
      });
      if (res.ok) {
        return { success: true, message: `DeepSeek active & ready! (${keys.length} key${keys.length > 1 ? 's' : ''})`, quotaAvailable: true };
      }
      if (res.status === 402) {
        return { success: false, message: 'DeepSeek insufficient balance / credits (402).', quotaAvailable: false };
      }
      if (res.status === 401) {
        return { success: false, message: 'Invalid DeepSeek API key (401).', quotaAvailable: false };
      }
      return { success: false, message: `DeepSeek error HTTP ${res.status}`, quotaAvailable: false };
    }

    if (provider === 'cerebras') {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${primaryKey}`,
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
      });
      if (res.ok) {
        return { success: true, message: `Cerebras active! (${keys.length} key${keys.length > 1 ? 's' : ''})`, quotaAvailable: true };
      }
      return { success: false, message: `Cerebras HTTP ${res.status}`, quotaAvailable: false };
    }

    return { success: true, message: `${keys.length} key(s) formatted and ready.`, quotaAvailable: true };
  } catch (err: any) {
    return { success: false, message: `Network error: ${err?.message || err}`, quotaAvailable: false };
  }
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

  // Check console status (Push Play / Pause / Auto-stop)
  const consoleStatus = await UserStorage.getAiConsoleStatus();
  if (consoleStatus === 'paused') {
    throw new Error('AI Engine is currently Paused. Open Profile -> API Configuration and tap Play to resume.');
  }

  // Explicit provider = caller's strict choice (existing behavior kept).
  if (options.provider) {
    return await callProviderDirect(options.provider, messages, jsonMode);
  }

  // No explicit provider → honor the user's switch (Profile → API Configuration).
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

const CHAIN_ORDER: ProviderId[] = ['groq', 'gemini', 'deepseek', 'cerebras', 'openrouter', 'pollinations', 'meta-llama'];

async function callProviderDirect(id: ProviderId, messages: ChatMessage[], jsonMode: boolean) {
  switch (id) {
    case 'groq':
      return await callGroq(messages, jsonMode);
    case 'gemini':
      return await callGemini(messages, jsonMode);
    case 'deepseek':
      return await callDeepSeek(messages, jsonMode);
    case 'cerebras':
      return await callCerebras(messages, jsonMode);
    case 'openrouter':
      return await callOpenRouter(messages, jsonMode);
    case 'pollinations':
      return await callPollinations(messages, jsonMode);
    case 'meta-llama':
      return await callMetaLlama(messages, jsonMode);
    default:
      return await callGroq(messages, jsonMode);
  }
}

async function callGroq(messages: ChatMessage[], jsonMode: boolean) {
  const userKeyStr = await UserStorage.getGroqKey();
  const remoteKeys = await RemoteConfigService.getKeys();
  
  const systemKeys = [remoteKeys.groq_key || API_CONFIG.GROQ_API_KEY].filter(Boolean);
  const userKeys = UserStorage.parseMultiKeys(userKeyStr);
  
  // Prioritize user's keys in order (first key, then rotate if exhausted), fallback to system
  let keysToTry = [...userKeys, ...systemKeys]
    .filter(k => k && !k.startsWith("YOUR_"));
  
  if (keysToTry.length === 0) {
    throw new Error('No Groq API keys found. Please add one in Profile -> API Config.');
  }

  let lastError = null;
  let allUserKeysExhausted = userKeys.length > 0;
  const MODELS = [API_CONFIG.GROQ_MODEL, ...(API_CONFIG.GROQ_FALLBACK_MODELS || [])];
  
  for (const apiKey of keysToTry) {
    for (let m = groqModelIdx; m < MODELS.length; m++) {
      try {
        const response = await fetch(API_CONFIG.ATS_ENGINE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: MODELS[m],
            messages: messages,
            temperature: 0.2,
            response_format: jsonMode ? { type: "json_object" } : undefined
          })
        });

        if (response.ok) {
          const data = await response.json();
          groqModelIdx = m; // stick with the working model
          markSuccess('groq');
          // Resume active status if it was previously auto-stopped
          await UserStorage.saveAiConsoleStatus('active');
          return data.choices[0].message.content;
        }

        const errorData = await response.text();
        console.log(`Groq ${MODELS[m]} key ${apiKey.substring(0, 8)}...: ${response.status} - ${errorData}`);

        if (response.status === 404) {
          // Model retired — advance permanently and try the next one.
          groqModelIdx = m + 1;
          lastError = new Error(`Groq model ${MODELS[m]} retired (404), trying next...`);
          continue;
        }

        if (response.status === 401 || response.status === 403) {
          lastError = new Error("API Key credits exhausted or invalid. Rotating to next key...");
          break; // key dead — rotate to next key
        }

        if (response.status === 429) {
          lastError = new Error("Groq Rate Limit (Credits) reached. Rotating to next key...");
          break; // rate-limited — rotate to next key
        }

        lastError = new Error(`Groq Error ${response.status}: ${errorData.substring(0, 50)}`);
        break; // unknown error — next key
      } catch (e) {
        console.log(`Groq Connection Failed for key ${apiKey.substring(0, 8)}...`, e);
        lastError = e;
        break; // connection failed — next key
      }
    }
  }

  // If all user keys were exhausted, automatically trigger Insufficient Quota stop
  if (allUserKeysExhausted) {
    await UserStorage.saveAiConsoleStatus('insufficient_quota');
    await UserStorage.saveAiConsoleError('All Groq keys reached rate limits or exhausted credits.');
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
  
  const systemKeys = [remoteKeys.gemini_key || API_CONFIG.GEMINI_API_KEY].filter(Boolean);
  const userKeys = UserStorage.parseMultiKeys(userKeyStr);
  
  // Try user keys first (in order with rotation), then fallback to system keys
  const keysToTry = [...userKeys, ...systemKeys].filter(k => k && !k.startsWith("YOUR_"));

  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  let lastError = null;
  let allUserKeysExhausted = userKeys.length > 0;

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
        await UserStorage.saveAiConsoleStatus('active');
        return data.candidates[0].content.parts[0].text;
      }
      
      const errorData = await response.text();
      console.log(`Gemini Key Failed (${apiKey.substring(0, 8)}...): ${response.status} - ${errorData}`);
      
      if (response.status === 429) {
        lastError = new Error("Gemini Quota Exceeded (429 RESOURCE_EXHAUSTED). Rotating to next key...");
        continue;
      }
      
      lastError = new Error(`Gemini Error: ${response.status}`);
    } catch (e) {
      console.log(`Gemini Connection Failed for key ${apiKey.substring(0, 8)}...`, e);
      lastError = e;
    }
  }

  if (allUserKeysExhausted) {
    await UserStorage.saveAiConsoleStatus('insufficient_quota');
    await UserStorage.saveAiConsoleError('All Gemini keys exceeded free quota. Auto-stopped.');
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

async function callDeepSeek(messages: ChatMessage[], jsonMode: boolean) {
  const userKeyStr = await UserStorage.getDeepSeekKey();
  const userKeys = UserStorage.parseMultiKeys(userKeyStr);
  const keysToTry = userKeys.filter(k => k && !k.startsWith("YOUR_"));
  if (keysToTry.length === 0) {
    throw new Error('No DeepSeek API key found. Please add one in Profile -> API Config.');
  }

  for (const apiKey of keysToTry) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.2,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        markSuccess('deepseek');
        await UserStorage.saveAiConsoleStatus('active');
        return data.choices[0].message.content;
      }

      const errText = await response.text();
      console.log(`DeepSeek key failed: ${apiKey.substring(0, 8)}... - ${response.status}: ${errText}`);
    } catch (e: any) {
      console.log('DeepSeek request error:', e);
    }
  }
  throw new Error('DeepSeek API request failed. Please check your key or balance.');
}

async function callOpenRouter(messages: ChatMessage[], jsonMode: boolean) {
  const userKeyStr = await UserStorage.getOpenRouterKey();
  const userKeys = UserStorage.parseMultiKeys(userKeyStr);
  const keysToTry = userKeys.filter(k => k && !k.startsWith("YOUR_"));
  if (keysToTry.length === 0) {
    throw new Error('No OpenRouter API key found. Please add one in Profile -> API Config.');
  }

  for (const apiKey of keysToTry) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/DineshWebDev2003/resume',
          'X-Title': 'NextGen Resume AI',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages,
          temperature: 0.2,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        markSuccess('openrouter');
        await UserStorage.saveAiConsoleStatus('active');
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.log('OpenRouter error:', e);
    }
  }
  throw new Error('OpenRouter API request failed.');
}

async function callCerebras(messages: ChatMessage[], jsonMode: boolean) {
  const userKeyStr = await UserStorage.getCerebrasKey();
  const userKeys = UserStorage.parseMultiKeys(userKeyStr);
  const keysToTry = userKeys.filter(k => k && !k.startsWith("YOUR_"));
  if (keysToTry.length === 0) {
    throw new Error('No Cerebras API key found. Please add one in Profile -> API Config.');
  }

  for (const apiKey of keysToTry) {
    try {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages,
          temperature: 0.2,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        markSuccess('cerebras');
        await UserStorage.saveAiConsoleStatus('active');
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.log('Cerebras error:', e);
    }
  }
  throw new Error('Cerebras API request failed.');
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

