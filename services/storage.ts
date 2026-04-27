import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  GROQ_API_KEY: 'user_groq_api_key',
  GEMINI_API_KEY: 'user_gemini_api_key',
  RESUME_VERSIONS: 'resume_versions',
};

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
  clearKeys: async () => {
    await AsyncStorage.removeItem(KEYS.GROQ_API_KEY);
    await AsyncStorage.removeItem(KEYS.GEMINI_API_KEY);
  },
  
  saveResumeVersion: async (name: string, data: any) => {
    const existing = await AsyncStorage.getItem(KEYS.RESUME_VERSIONS);
    let versions = existing ? JSON.parse(existing) : [];
    
    // Check if name already exists, update it, otherwise add
    const index = versions.findIndex((v: any) => v.name === name);
    if (index > -1) {
      versions[index].data = data;
      versions[index].updatedAt = new Date().toISOString();
    } else {
      if (versions.length >= 3) {
        throw new Error("Maximum of 3 versions allowed. Please delete one to save a new one.");
      }
      versions.push({ name, data, updatedAt: new Date().toISOString() });
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
  }
};
