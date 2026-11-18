import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type JobApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  url: string;
  type?: string;
  salary?: string;
  description?: string;
  source: 'google' | 'verified' | string;
  savedAt: number;
  status?: JobApplicationStatus;
  updatedAt?: number;
}

interface JobState {
  savedJobs: SavedJob[];
  saveJob: (job: SavedJob) => void;
  unsaveJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  updateJobStatus: (jobId: string, status: JobApplicationStatus) => void;
  getJobStatus: (jobId: string) => JobApplicationStatus | undefined;
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      savedJobs: [],
      saveJob: (job) => {
        const { savedJobs } = get();
        const existing = savedJobs.find((j) => j.id === job.id);
        if (!existing) {
          set({ savedJobs: [{ ...job, status: job.status || 'saved', updatedAt: Date.now() }, ...savedJobs] });
        }
      },
      unsaveJob: (jobId) => {
        const { savedJobs } = get();
        set({ savedJobs: savedJobs.filter((j) => j.id !== jobId) });
      },
      isJobSaved: (jobId) => {
        return get().savedJobs.some((j) => j.id === jobId);
      },
      updateJobStatus: (jobId, status) => {
        const { savedJobs } = get();
        const existing = savedJobs.find((j) => j.id === jobId);
        if (existing) {
          set({
            savedJobs: savedJobs.map((j) =>
              j.id === jobId ? { ...j, status, updatedAt: Date.now() } : j
            ),
          });
        } else {
          // If not in savedJobs yet, create entry with this status
          set({
            savedJobs: [
              {
                id: jobId,
                title: 'Job Application',
                company: 'Company',
                location: 'Remote',
                url: '',
                source: 'verified',
                savedAt: Date.now(),
                status,
                updatedAt: Date.now(),
              },
              ...savedJobs,
            ],
          });
        }
      },
      getJobStatus: (jobId) => {
        return get().savedJobs.find((j) => j.id === jobId)?.status;
      },
    }),
    {
      name: 'saved-jobs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
