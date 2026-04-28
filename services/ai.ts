import { API_CONFIG } from '@/constants/config';
import { UserStorage } from './storage';

export type AIProvider = 'groq' | 'gemini';

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
  const { provider = 'groq', jsonMode = true } = options;

  if (provider === 'groq') {
    return await callGroq(messages, jsonMode);
  }

  // Gemini is now 'muted' and only called if explicitly requested as provider
  return await callGemini(messages, jsonMode);
}

async function callGroq(messages: ChatMessage[], jsonMode: boolean) {
  const userKeyStr = await UserStorage.getGroqKey();
  const systemKeys = [API_CONFIG.GROQ_API_KEY];
  const userKeys = userKeyStr ? userKeyStr.split(',').map(k => k.trim()).filter(Boolean) : [];
  
  // Combine keys and shuffle to balance load/credits
  let keysToTry = [...userKeys, ...systemKeys]
    .filter(k => k && k !== "YOUR_GROQ_API_KEY")
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
        return data.choices[0].message.content;
      }
      
      const errorData = await response.text();
      console.log(`Groq Key Failed (${apiKey.substring(0, 8)}...): ${response.status} - ${errorData}`);
      
      if (response.status === 429) {
        lastError = new Error("Groq Rate Limit exceeded. Trying next key...");
        continue;
      }
      
      lastError = new Error(`Groq Error ${response.status}: ${errorData.substring(0, 50)}`);
    } catch (e) {
      console.log(`Groq Connection Failed for key ${apiKey.substring(0, 8)}...`, e);
      lastError = e;
    }
  }
  
  // If we reach here, all Groq keys failed.
  // Final fallback to Gemini as a safety net (unless user strictly forbade it)
  console.log("All Groq keys failed. Attempting emergency fallback to Gemini...");
  try {
    return await callGemini(messages, jsonMode);
  } catch (geminiErr) {
    throw lastError || new Error('All AI Providers (Groq & Gemini) are currently unavailable.');
  }
}

async function callGemini(messages: ChatMessage[], jsonMode: boolean) {
  const userKeyStr = await UserStorage.getGeminiKey();
  const systemKeys = [API_CONFIG.GEMINI_API_KEY];
  const userKeys = userKeyStr ? userKeyStr.split(',').map(k => k.trim()).filter(Boolean) : [];
  
  // Try user keys first, then fallback to system keys
  const keysToTry = [...userKeys, ...systemKeys];

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

  throw lastError || new Error('All Gemini keys failed');
}

