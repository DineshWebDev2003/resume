import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  GROQ_API_KEY: 'user_groq_api_key',
  GEMINI_API_KEY: 'user_gemini_api_key',
  POLLINATIONS_API_KEY: 'user_pollinations_api_key',
  LLAMA_API_KEY: 'user_llama_api_key',
  PREFERRED_PROVIDER: 'user_preferred_provider',
  RESUME_VERSIONS: 'resume_versions',
  IMPORT_HISTORY: 'resume_import_history',
};

/** 'auto' = full fallback chain. A specific id = try it first, chain as backup. */
export type PreferredProvider = 'auto' | 'groq' | 'gemini' | 'pollinations' | 'meta-llama';

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
  savePreferredProvider: async (p: PreferredProvider) => {
    await AsyncStorage.setItem(KEYS.PREFERRED_PROVIDER, p);
  },
  getPreferredProvider: async (): Promise<PreferredProvider> => {
    const v = await AsyncStorage.getItem(KEYS.PREFERRED_PROVIDER);
    return v === 'groq' || v === 'gemini' || v === 'pollinations' || v === 'meta-llama'
      ? v
      : 'auto';
  },
  clearKeys: async () => {
    await AsyncStorage.removeItem(KEYS.GROQ_API_KEY);
    await AsyncStorage.removeItem(KEYS.GEMINI_API_KEY);
    await AsyncStorage.removeItem(KEYS.POLLINATIONS_API_KEY);
    await AsyncStorage.removeItem(KEYS.LLAMA_API_KEY);
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
