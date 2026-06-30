import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface RemoteKeys {
  groq_key: string;
  gemini_key: string;
}

let cachedKeys: RemoteKeys | null = null;

export const RemoteConfigService = {
  /**
   * Fetches API keys from Firestore (settings/api_keys)
   * This prevents keys from being exposed in GitHub.
   */
  async getKeys(): Promise<RemoteKeys> {
    if (cachedKeys) return cachedKeys;

    try {
      const docRef = doc(db, 'settings', 'api_keys');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        cachedKeys = docSnap.data() as RemoteKeys;
        return cachedKeys;
      } else {
        console.warn('Remote keys not found in Firestore. Falling back to local config.');
        return { groq_key: '', gemini_key: '' };
      }
    } catch (error) {
      // Suppress noisy permission errors in the console and gracefully fallback
      console.log('Using local AI keys (Remote config unavailable)');
      return { groq_key: '', gemini_key: '' };
    }
  }
};
