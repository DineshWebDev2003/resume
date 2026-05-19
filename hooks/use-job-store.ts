import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  url: string;
  type?: string;
  salary?: string;
  source: 'google' | 'verified';
  savedAt: number;
}

interface JobState {
  savedJobs: SavedJob[];
  saveJob: (job: SavedJob) => void;
  unsaveJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      savedJobs: [],
      saveJob: (job) => {
        const { savedJobs } = get();
        if (!savedJobs.find((j) => j.id === job.id)) {
          set({ savedJobs: [job, ...savedJobs] });
        }
      },
      unsaveJob: (jobId) => {
        const { savedJobs } = get();
        set({ savedJobs: savedJobs.filter((j) => j.id !== jobId) });
      },
      isJobSaved: (jobId) => {
        return get().savedJobs.some((j) => j.id === jobId);
      },
    }),
    {
      name: 'saved-jobs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
