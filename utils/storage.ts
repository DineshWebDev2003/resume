import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResumeData } from "@/components/resume-templates";

const RESUMES_KEY = "user_resumes";
const MAX_RESUMES = 3;

export interface UserResume {
  id: string;
  name: string;
  role: string;
  template: string;
  color: string;
  data: ResumeData;
  lastModified: number;
}

export const saveResume = async (
  resume: Omit<UserResume, "id" | "lastModified">,
  id?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const existingResumes = await getResumes();
    
    if (!id && existingResumes.length >= MAX_RESUMES) {
      return { 
        success: false, 
        message: `You can only store up to ${MAX_RESUMES} resumes. Delete one to create a new one.` 
      };
    }

    let updatedResumes: UserResume[];
    if (id) {
      updatedResumes = existingResumes.map((r) =>
        r.id === id 
          ? { ...resume, id, lastModified: Date.now() } 
          : r
      );
    } else {
      const newResume: UserResume = {
        ...resume,
        id: Date.now().toString(),
        lastModified: Date.now(),
      };
      updatedResumes = [newResume, ...existingResumes];
    }

    await AsyncStorage.setItem(RESUMES_KEY, JSON.stringify(updatedResumes));
    return { success: true, message: "Resume saved successfully!" };
  } catch (error) {
    console.error("Error saving resume:", error);
    return { success: false, message: "Failed to save resume." };
  }
};

export const getResumes = async (): Promise<UserResume[]> => {
  try {
    const data = await AsyncStorage.getItem(RESUMES_KEY);
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
    await AsyncStorage.setItem(RESUMES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting resume:", error);
    return false;
  }
};
