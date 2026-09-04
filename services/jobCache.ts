/**
 * Tiny TTL cache (memory + AsyncStorage) so tab switches and
 * back-navigation render instantly instead of refetching.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const mem = new Map<string, { at: number; data: any }>();

export async function getCached<T>(key: string, maxAgeMs: number): Promise<T | null> {
  const m = mem.get(key);
  if (m && Date.now() - m.at < maxAgeMs) return m.data as T;
  try {
    const raw = await AsyncStorage.getItem(`ttlc_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > maxAgeMs) return null;
    mem.set(key, parsed);
    return parsed.data as T;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: any): Promise<void> {
  const entry = { at: Date.now(), data };
  mem.set(key, entry);
  try {
    await AsyncStorage.setItem(`ttlc_${key}`, JSON.stringify(entry));
  } catch {}
}

export function getMem<T>(key: string): T | null {
  const m = mem.get(key);
  return m ? (m.data as T) : null;
}

export function setMem(key: string, data: any): void {
  mem.set(key, { at: Date.now(), data });
}
