import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResumeData } from "@/components/resume-templates";
import { auth } from "@/services/firebase";

const getResumesKey = () => {
  const user = auth.currentUser;
  return user ? `user_resumes_${user.uid}` : "user_resumes";
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
}

export const saveResume = async (
  resume: Omit<UserResume, "id" | "lastModified" | "resumeNumber">,
  id?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const existingResumes = await getResumes();
    
    const cachedLimitStr = await AsyncStorage.getItem('cached_resume_limit');
    const dynamicLimit = cachedLimitStr ? parseInt(cachedLimitStr, 10) : 3;
    
    if (!id && existingResumes.length >= dynamicLimit) {
      return { 
        success: false, 
        message: `You can only store up to ${dynamicLimit} resumes. Watch ads or refer friends to increase this limit!` 
      };
    }

    let updatedResumes: UserResume[];
    if (id) {
      updatedResumes = existingResumes.map((r) =>
        r.id === id 
          ? { ...r, ...resume, lastModified: Date.now() } 
          : r
      );
    } else {
      // Find the highest number or just count
      const nextNum = existingResumes.length + 1;
      const resumeNumber = `#${nextNum.toString().padStart(3, '0')}`;
      
      const newResume: UserResume = {
        ...resume,
        id: Date.now().toString(),
        lastModified: Date.now(),
        resumeNumber,
      };
      updatedResumes = [newResume, ...existingResumes];
    }

    await AsyncStorage.setItem(getResumesKey(), JSON.stringify(updatedResumes));
    return { success: true, message: "Resume saved successfully!" };
  } catch (error) {
    console.error("Error saving resume:", error);
    return { success: false, message: "Failed to save resume." };
  }
};

export const getResumes = async (): Promise<UserResume[]> => {
  try {
    const data = await AsyncStorage.getItem(getResumesKey());
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
    await AsyncStorage.setItem(getResumesKey(), JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting resume:", error);
    return false;
  }
};
