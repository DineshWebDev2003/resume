import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResumeData } from "@/components/resume-templates";
import { API_CONFIG } from "@/constants/config";

async function getCurrentUserId() {
  try {
    const raw = await AsyncStorage.getItem("auth_user_v1");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.uid) return u.uid as string;
    }
  } catch {}
  try {
    if ((API_CONFIG as any).AUTH_PROVIDER !== "better-auth") {
      const { auth } = require("@/services/firebase");
      return auth.currentUser?.uid || null;
    }
  } catch {}
  return null;
}

const getResumesKey = async () => {
  const uid = await getCurrentUserId();
  return uid ? `user_resumes_${uid}` : "user_resumes";
};
const MAX_RESUMES = 3;

export interface UserResume {
  id: string;
  name: string;
  role: string;
  template: string;
  color: string;
  data: ResumeData;
  lastModified: number;
  snapshotUri?: string; // New field for image preview
  resumeNumber?: string; // New field for #001 format
  fileUri?: string; // Original uploaded file (PDF) — shown as-is, never restyled
  source?: 'builder' | 'upload'; // 'upload' = older resume PDF, view original
}

export const saveResume = async (
  resume: Omit<UserResume, "id" | "lastModified" | "resumeNumber">,
  id?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const existingResumes = await getResumes();
    const cachedLimitStr = await AsyncStorage.getItem('cached_resume_limit');
    const cachedEmail = (JSON.parse((await AsyncStorage.getItem('auth_user_v1')) || 'null')?.email || '').toLowerCase();
    const isUnlimited = cachedLimitStr ? parseInt(cachedLimitStr, 10) >= 999999 : (cachedEmail === 'dinesh.mahi.dev@gmail.com');
    const dynamicLimit = isUnlimited ? 999999 : (cachedLimitStr ? parseInt(cachedLimitStr, 10) : MAX_RESUMES);

    if (!id && existingResumes.length >= dynamicLimit) {
      return { success: false, message: `You can only store up to ${dynamicLimit} resumes.` };
    }

    let updatedResumes: UserResume[];
    if (id) {
      updatedResumes = existingResumes.map((r) => (r.id === id ? { ...r, ...resume, lastModified: Date.now() } : r));
    } else {
      const nextNum = existingResumes.length + 1;
      const resumeNumber = `#${nextNum.toString().padStart(3, '0')}`;
      updatedResumes = [{ ...resume, id: Date.now().toString(), lastModified: Date.now(), resumeNumber }, ...existingResumes];
    }

    await AsyncStorage.setItem(await getResumesKey(), JSON.stringify(updatedResumes));
    return { success: true, message: "Resume saved successfully!" };
  } catch (error) {
    console.error("Error saving resume:", error);
    return { success: false, message: "Failed to save resume." };
  }
};

export const getResumes = async (): Promise<UserResume[]> => {
  try {
    const data = await AsyncStorage.getItem(await getResumesKey());
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting resumes:", error);
    return [];
  }
};

export const deleteResume = async (id: string): Promise<boolean> => {
  try {
    const existingResumes = await getResumes();
    const filtered = existingResumes.filter((r) => r.id !== id);
    await AsyncStorage.setItem(await getResumesKey(), JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting resume:", error);
    return false;
  }
};
