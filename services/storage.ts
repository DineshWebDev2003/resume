import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  GROQ_API_KEY: 'user_groq_api_key',
  GEMINI_API_KEY: 'user_gemini_api_key',
  POLLINATIONS_API_KEY: 'user_pollinations_api_key',
  LLAMA_API_KEY: 'user_llama_api_key',
  OPENROUTER_API_KEY: 'user_openrouter_api_key',
  CEREBRAS_API_KEY: 'user_cerebras_api_key',
  MISTRAL_API_KEY: 'user_mistral_api_key',
  DEEPSEEK_API_KEY: 'user_deepseek_api_key',
  TOGETHER_API_KEY: 'user_together_api_key',
  AI_CONSOLE_STATUS: 'user_ai_console_status',
  AI_CONSOLE_LAST_ERROR: 'user_ai_console_last_error',
  PREFERRED_PROVIDER: 'user_preferred_provider',
  RESUME_VERSIONS: 'resume_versions',
  IMPORT_HISTORY: 'resume_import_history',
};

/** 'auto' = full fallback chain. A specific id = try it first, chain as backup. */
export type PreferredProvider = 'auto' | 'groq' | 'gemini' | 'openrouter' | 'cerebras' | 'mistral' | 'deepseek' | 'together' | 'pollinations' | 'meta-llama';
export type AiConsoleStatus = 'active' | 'paused' | 'insufficient_quota';

export const UserStorage = {
  saveGroqKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.GROQ_API_KEY, key);
  },
  getGroqKey: async () => {
    return await AsyncStorage.getItem(KEYS.GROQ_API_KEY);
  },
  saveGeminiKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.GEMINI_API_KEY, key);
  },
  getGeminiKey: async () => {
    return await AsyncStorage.getItem(KEYS.GEMINI_API_KEY);
  },
  saveOpenRouterKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.OPENROUTER_API_KEY, key);
  },
  getOpenRouterKey: async () => {
    return await AsyncStorage.getItem(KEYS.OPENROUTER_API_KEY);
  },
  saveCerebrasKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.CEREBRAS_API_KEY, key);
  },
  getCerebrasKey: async () => {
    return await AsyncStorage.getItem(KEYS.CEREBRAS_API_KEY);
  },
  saveMistralKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.MISTRAL_API_KEY, key);
  },
  getMistralKey: async () => {
    return await AsyncStorage.getItem(KEYS.MISTRAL_API_KEY);
  },
  saveDeepSeekKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.DEEPSEEK_API_KEY, key);
  },
  getDeepSeekKey: async () => {
    return await AsyncStorage.getItem(KEYS.DEEPSEEK_API_KEY);
  },
  saveTogetherKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.TOGETHER_API_KEY, key);
  },
  getTogetherKey: async () => {
    return await AsyncStorage.getItem(KEYS.TOGETHER_API_KEY);
  },
  savePollinationsKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.POLLINATIONS_API_KEY, key);
  },
  getPollinationsKey: async () => {
    return await AsyncStorage.getItem(KEYS.POLLINATIONS_API_KEY);
  },
  saveLlamaKey: async (key: string) => {
    await AsyncStorage.setItem(KEYS.LLAMA_API_KEY, key);
  },
  getLlamaKey: async () => {
    return await AsyncStorage.getItem(KEYS.LLAMA_API_KEY);
  },
  saveAiConsoleStatus: async (status: AiConsoleStatus) => {
    await AsyncStorage.setItem(KEYS.AI_CONSOLE_STATUS, status);
  },
  getAiConsoleStatus: async (): Promise<AiConsoleStatus> => {
    const s = await AsyncStorage.getItem(KEYS.AI_CONSOLE_STATUS);
    if (s === 'paused' || s === 'insufficient_quota') return s;
    return 'active';
  },
  saveAiConsoleError: async (err: string) => {
    await AsyncStorage.setItem(KEYS.AI_CONSOLE_LAST_ERROR, err);
  },
  getAiConsoleError: async () => {
    return await AsyncStorage.getItem(KEYS.AI_CONSOLE_LAST_ERROR);
  },
  savePreferredProvider: async (p: PreferredProvider) => {
    await AsyncStorage.setItem(KEYS.PREFERRED_PROVIDER, p);
  },
  getPreferredProvider: async (): Promise<PreferredProvider> => {
    const v = await AsyncStorage.getItem(KEYS.PREFERRED_PROVIDER);
    const valid = ['groq', 'gemini', 'openrouter', 'cerebras', 'mistral', 'deepseek', 'together', 'pollinations', 'meta-llama'];
    return (valid.includes(v as string)) ? (v as PreferredProvider) : 'auto';
  },
  /** Parses user key input, supporting comma-separated and line-separated multiple keys */
  parseMultiKeys: (rawKeyString: string | null | undefined): string[] => {
    if (!rawKeyString) return [];
    return rawKeyString
      .split(/[\r\n,]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5 && !k.startsWith('YOUR_'));
  },
  clearKeys: async () => {
    await AsyncStorage.removeItem(KEYS.GROQ_API_KEY);
    await AsyncStorage.removeItem(KEYS.GEMINI_API_KEY);
    await AsyncStorage.removeItem(KEYS.OPENROUTER_API_KEY);
    await AsyncStorage.removeItem(KEYS.CEREBRAS_API_KEY);
    await AsyncStorage.removeItem(KEYS.MISTRAL_API_KEY);
    await AsyncStorage.removeItem(KEYS.DEEPSEEK_API_KEY);
    await AsyncStorage.removeItem(KEYS.TOGETHER_API_KEY);
    await AsyncStorage.removeItem(KEYS.POLLINATIONS_API_KEY);
    await AsyncStorage.removeItem(KEYS.LLAMA_API_KEY);
    await AsyncStorage.setItem(KEYS.AI_CONSOLE_STATUS, 'active');
  },

  saveUserRole: async (role: 'job_seeker' | 'recruiter') => {
    await AsyncStorage.setItem('user_app_role', role);
  },
  getUserRole: async (): Promise<'job_seeker' | 'recruiter'> => {
    const role = await AsyncStorage.getItem('user_app_role');
    return (role as 'job_seeker' | 'recruiter') || 'job_seeker';
  },
  
  saveResumeVersion: async (name: string, data: any) => {
    const existing = await AsyncStorage.getItem(KEYS.RESUME_VERSIONS);
    let versions = existing ? JSON.parse(existing) : [];
    
    const dateStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Check if name already exists, update it, otherwise add
    const index = versions.findIndex((v: any) => v.name === name);
    if (index > -1) {
      versions[index].data = data;
      versions[index].updatedAt = new Date().toISOString();
      versions[index].date = dateStr;
    } else {
      if (versions.length >= 3) {
        throw new Error("Maximum of 3 versions allowed. Please delete one to save a new one.");
      }
      versions.push({ name, data, updatedAt: new Date().toISOString(), date: dateStr });
    }
    
    await AsyncStorage.setItem(KEYS.RESUME_VERSIONS, JSON.stringify(versions));
  },
  
  getResumeVersions: async () => {
    const existing = await AsyncStorage.getItem(KEYS.RESUME_VERSIONS);
    return existing ? JSON.parse(existing) : [];
  },
  
  deleteResumeVersion: async (name: string) => {
    const existing = await AsyncStorage.getItem(KEYS.RESUME_VERSIONS);
    if (existing) {
      let versions = JSON.parse(existing);
      versions = versions.filter((v: any) => v.name !== name);
      await AsyncStorage.setItem(KEYS.RESUME_VERSIONS, JSON.stringify(versions));
    }
  },

  saveImportHistory: async (name: string, data: any) => {
    const existing = await AsyncStorage.getItem(KEYS.IMPORT_HISTORY);
    let history = existing ? JSON.parse(existing) : [];
    
    // Format friendly date string
    const dateStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      data,
      date: dateStr,
      updatedAt: new Date().toISOString()
    };
    
    // Prepend and limit to 4
    history.unshift(newEntry);
    history = history.slice(0, 4);
    
    await AsyncStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify(history));
  },
  
  getImportHistory: async () => {
    const existing = await AsyncStorage.getItem(KEYS.IMPORT_HISTORY);
    return existing ? JSON.parse(existing) : [];
  },
  
  clearImportHistory: async () => {
    await AsyncStorage.removeItem(KEYS.IMPORT_HISTORY);
  },
  
  deleteImportHistory: async (id: string) => {
    const existing = await AsyncStorage.getItem(KEYS.IMPORT_HISTORY);
    if (existing) {
      let history = JSON.parse(existing);
      history = history.filter((item: any) => item.id !== id);
      await AsyncStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify(history));
    }
  },

  renameResumeVersion: async (oldName: string, newName: string) => {
    const existing = await AsyncStorage.getItem(KEYS.RESUME_VERSIONS);
    if (existing) {
      let versions = JSON.parse(existing);
      const index = versions.findIndex((v: any) => v.name === oldName);
      if (index > -1) {
        versions[index].name = newName;
        await AsyncStorage.setItem(KEYS.RESUME_VERSIONS, JSON.stringify(versions));
      }
    }
  },

  renameImportHistory: async (id: string, newName: string) => {
    const existing = await AsyncStorage.getItem(KEYS.IMPORT_HISTORY);
    if (existing) {
      let history = JSON.parse(existing);
      const index = history.findIndex((item: any) => item.id === id);
      if (index > -1) {
        history[index].name = newName;
        await AsyncStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify(history));
      }
    }
  }
};
