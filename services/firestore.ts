import { db, auth } from './firebase';
import { DEFAULT_AUTO_APPLY_SETTINGS } from '@/constants/autoApply';
import type { AutoApplySettings, AutoApplyStatus } from '@/constants/autoApply';
import type { ApplicationRecord } from './autoApply';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  orderBy, 
  limit, 
  updateDoc, 
  getDoc,
  setDoc,
  increment,
  serverTimestamp 
} from 'firebase/firestore';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  jobRoles: string[];
  location: string;
  education: string;
  phone?: string;
  portfolio?: string;
  profilePic?: string;
  resumeLimit: number;
  referralCode: string;
  referralCount: number;
  groqKey?: string;
  geminiKey?: string;
  pollinationsKey?: string;
  llamaKey?: string;
  preferredProvider?: string;
  onboardingCompleted?: boolean;
  isIT?: boolean;
  primaryRole?: string;
  createdAt: any;
  updatedAt: any;
}

// Check and initialize user profile
export const checkAndInitProfile = async (user: any) => {
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const referralCode = `RESUME-${user.uid.substring(0, 5).toUpperCase()}`;
    const newProfile: UserProfile = {
      userId: user.uid,
      name: user.displayName || 'User',
      email: user.email || '',
      jobRoles: [],
      location: '',
      education: '',
      resumeLimit: 3,
      referralCode,
      referralCount: 0,
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userDocRef, newProfile);
    return newProfile;
  }
  return userDoc.data() as UserProfile;
};

// Update user profile
export const updateUserProfile = async (data: Partial<UserProfile>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const userDocRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userDocRef);
  if (!docSnap.exists()) {
    const referralCode = `RESUME-${user.uid.substring(0, 5).toUpperCase()}`;
    await setDoc(userDocRef, {
      userId: user.uid,
      name: user.displayName || 'User',
      email: user.email || '',
      jobRoles: [],
      location: '',
      education: '',
      resumeLimit: 3,
      referralCode,
      referralCount: 0,
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data,
    });
  } else {
    await setDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
};

export const incrementResumeLimit = async (amount: number) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, {
    resumeLimit: increment(amount),
    updatedAt: serverTimestamp(),
  });
};

// --- ATS Analytics History ---

export const saveAtsHistory = async (atsData: {
  score: number;
  jobTitle: string;
  analysis: any;
  resumeName: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const atsCollection = collection(db, 'ats_history');
  
  // 1. Get existing history (Simple query to avoid index requirement)
  const q = query(
    atsCollection, 
    where('userId', '==', user.uid)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

  // Sort in-memory if needed for limit check
  docs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  
  // 2. If >= 3, delete the oldest
  if (docs.length >= 3) {
    const oldest = docs[0];
    
    // Delete from Cloudinary if image exists
    if (oldest.cloudinaryPublicId) {
      const { deleteFromCloudinary } = await import('./cloudinary');
      await deleteFromCloudinary(oldest.cloudinaryPublicId).catch(console.error);
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'ats_history', oldest.id));
  }

  // 3. Add new entry
  const docRef = await addDoc(atsCollection, {
    ...atsData,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getAtsHistory = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(
    collection(db, 'ats_history'), 
    where('userId', '==', user.uid)
  );
  const querySnapshot = await getDocs(q);
  
  // Sort in-memory to avoid Index error
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

// --- Job Applications ---

export const saveJobApplication = async (job: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const appCollection = collection(db, 'job_applications');
  
  // Check if already applied
  const q = query(
    appCollection,
    where('userId', '==', user.uid),
    where('jobId', '==', job.id || job.title + (job.company_name || job.company))
  );
  
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error('You have already applied to this job.');
  }

  await addDoc(appCollection, {
    userId: user.uid,
    jobId: job.id || job.title + (job.company_name || job.company),
    title: job.title,
    company: job.company_name || job.company,
    location: job.location,
    logo: job.thumbnail || job.logo,
    appliedAt: serverTimestamp(),
    status: 'Applied', // Default status
    statusColor: '#F59E0B'
  });
};

export const getMyApplications = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'job_applications'),
    where('userId', '==', user.uid)
  );

  const snapshot = await getDocs(q);
  const legacy = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    appliedAt: doc.data().appliedAt?.toDate() || new Date()
  }));

  // Merge Auto Apply records stored under users/{uid}/applications.
  // ONLY truly Applied ones — Matched/Skipped/Manual live in the AI Apply tab.
  // (Deduped by jobId; same tracker, no duplicate feature.)
  let auto: any[] = [];
  try {
    auto = (await getAutoApplyRecords()).filter((a: any) => a.status === 'Applied');
  } catch (e) {
    console.warn('[Applications] Auto Apply subcollection read failed:', e);
  }

  const seen = new Set(legacy.map((a: any) => a.jobId));
  const merged = [
    ...legacy,
    ...auto
      .filter((a: any) => !seen.has(a.jobId))
      .map((a: any) => ({
        id: `auto_${a.jobId}`,
        ...a,
        appliedAt: a.appliedAt instanceof Date ? a.appliedAt : new Date(),
      })),
  ];

  return merged.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
};

// --- Auto Apply (extension of the existing application tracker) ---

const safeDocId = (s: string) =>
  (s || '').replace(/[/\\#?[\]]/g, '_').slice(0, 200) || Date.now().toString();

/** Firestore rejects `undefined` field values — drop them before any write. */
const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out as T;
};

/** Load Auto Apply settings; roles/location fall back to the user profile. */
export const getAutoApplySettings = async (): Promise<AutoApplySettings> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const cfgRef = doc(db, 'users', user.uid, 'autoApplySettings', 'config');
  const cfgSnap = await getDoc(cfgRef);
  const saved = cfgSnap.exists() ? (cfgSnap.data() as Partial<AutoApplySettings>) : {};

  // Mirror 1–3 roles + location from the existing profile when unset.
  let profileRoles: string[] = [];
  let profileLocation = '';
  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists()) {
      const d = userSnap.data() as any;
      profileRoles = (d.jobRoles || []).filter(Boolean).slice(0, 3);
      profileLocation = d.location || '';
    }
  } catch (e) {
    console.warn('[AutoApply] Profile fallback read failed:', e);
  }

  return {
    ...DEFAULT_AUTO_APPLY_SETTINGS,
    ...saved,
    roles: (saved.roles?.length ? saved.roles : profileRoles).slice(0, 3),
    locations:
      saved.locations?.length
        ? saved.locations
        : profileLocation
          ? [profileLocation]
          : [],
    enabled: saved.enabled === true, // Explicit opt-in only.
  };
};

export const saveAutoApplySettings = async (
  patch: Partial<AutoApplySettings>,
): Promise<AutoApplySettings> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const cfgRef = doc(db, 'users', user.uid, 'autoApplySettings', 'config');
  const next = {
    ...patch,
    roles: patch.roles ? patch.roles.filter(Boolean).slice(0, 3) : undefined,
    updatedAt: serverTimestamp(),
  };
  // Strip undefined so merge never deletes existing keys.
  Object.keys(next).forEach(
    (k) => (next as any)[k] === undefined && delete (next as any)[k],
  );
  await setDoc(cfgRef, next, { merge: true });
  return getAutoApplySettings();
};

/**
 * Persist an Auto Apply result. Writes to users/{uid}/applications/{jobId}
 * and mirrors into the existing top-level job_applications collection so
 * the current tracker UI shows it with zero redesign.
 */
export const saveAutoApplyRecord = async (
  record: ApplicationRecord,
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const id = safeDocId(record.jobId);
  const payload = stripUndefined({
    ...record,
    userId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'users', user.uid, 'applications', id), payload, {
    merge: true,
  });

  // Mirror into the existing top-level tracker ONLY when actually applied.
  // Anything else (Matched/Skipped/Manual) lives in the AI Apply tab.
  if (record.status === 'Applied') {
    await setDoc(
      doc(db, 'job_applications', `${user.uid}_${id}`),
      stripUndefined({
        userId: user.uid,
        jobId: record.jobId,
        title: record.title,
        company: record.company,
        location: record.location,
        logo: record.logo || null,
        applyLink: record.applyUrl || null,
        source: record.source,
        matchScore: record.matchScore,
        atsScore: record.atsScore,
        resumeCustomized: record.resumeCustomized,
        status: record.status,
        statusColor: record.statusColor,
        autoApplied: record.autoApplied,
        appliedAt: serverTimestamp(),
      }),
      { merge: true },
    );
  }

  return id;
};

export const updateAutoApplyStatus = async (
  jobId: string,
  status: AutoApplyStatus,
  extra: Record<string, any> = {},
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const id = safeDocId(jobId);
  const patch = stripUndefined({ status, ...extra, updatedAt: serverTimestamp() });
  await setDoc(doc(db, 'users', user.uid, 'applications', id), patch, {
    merge: true,
  });
  if (status === 'Applied') {
    await setDoc(doc(db, 'job_applications', `${user.uid}_${id}`), patch, {
      merge: true,
    });
  } else {
    // Never let non-applied records linger in the Applied tracker.
    await deleteDoc(doc(db, 'job_applications', `${user.uid}_${id}`)).catch(() => {});
  }
};

/**
 * One-time self-healing: removes non-applied auto mirrors that an earlier
 * build wrote into the top-level tracker (the "34 phantom applications").
 * Only touches docs explicitly marked autoApplied === false.
 */
export const cleanupStaleAutoMirrors = async (): Promise<number> => {
  const user = auth.currentUser;
  if (!user) return 0;
  try {
    const q = query(
      collection(db, 'job_applications'),
      where('userId', '==', user.uid),
    );
    const snap = await getDocs(q);
    let removed = 0;
    for (const d of snap.docs) {
      const data = d.data() as any;
      if (data.autoApplied === false && data.status !== 'Applied') {
        await deleteDoc(d.ref).catch(() => {});
        removed += 1;
      }
    }
    if (removed > 0) console.log(`[Applications] Cleaned ${removed} stale auto mirrors.`);
    return removed;
  } catch (e) {
    console.warn('[Applications] Mirror cleanup failed:', e);
    return 0;
  }
};

export const getAutoApplyRecords = async (): Promise<any[]> => {  const user = auth.currentUser;
  if (!user) return [];

  const snapshot = await getDocs(
    collection(db, 'users', user.uid, 'applications'),
  );
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    appliedAt:
      (d.data() as any).updatedAt?.toDate?.() ||
      (d.data() as any).createdAt?.toDate?.() ||
      new Date(),
  }));
};

// --- Resume Storage (Optional Mirror in Firestore) ---

export const saveResumeToFirestore = async (resume: any, id?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const resumeRef = id ? doc(db, 'resumes', id) : doc(collection(db, 'resumes'));
  await setDoc(resumeRef, {
    ...resume,
    userId: user.uid,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// --- Referral System ---

export const applyReferralCode = async (code: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User not authenticated');

  // 1. Validate if user is trying to use their own code
  const userDocRef = doc(db, 'users', currentUser.uid);
  const userDocSnap = await getDoc(userDocRef);
  const userData = userDocSnap.data();

  if (userData?.referralCode === code) {
    throw new Error('You cannot use your own referral code!');
  }

  if (userData?.referredBy) {
    throw new Error('You have already redeemed a referral code.');
  }

  // 2. Find the referrer
  const q = query(collection(db, 'users'), where('referralCode', '==', code));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Invalid referral code. Please check and try again.');
  }

  const referrerDoc = querySnapshot.docs[0];
  const referrerId = referrerDoc.id;

  // 3. Update referrer: +2 resume slots, +1 referral count
  const referrerRef = doc(db, 'users', referrerId);
  await updateDoc(referrerRef, {
    resumeLimit: increment(2),
    referralCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  // 4. Update current user: +2 resume slots, set referredBy
  await updateDoc(userDocRef, {
    resumeLimit: increment(2),
    referredBy: referrerId,
    updatedAt: serverTimestamp(),
  });

  return true;
};

// --- Global Job Caching (7-day TTL, auto-purge jobs older than 7 days) ---

const CACHE_TTL_DAYS = 7;
const JOB_MAX_AGE_DAYS = 7;

/** Returns true if a job's posted date is older than JOB_MAX_AGE_DAYS */
const isJobStale = (job: any): boolean => {
  // Check various date fields that job APIs might return
  const rawDate =
    job.date_posted ||
    job.posted_at ||
    job.pubDate ||
    job.created ||
    job.publishedAt ||
    null;

  if (!rawDate) return false; // Keep jobs with no date (can't determine age)

  const posted = new Date(rawDate);
  if (isNaN(posted.getTime())) return false;

  const ageMs = Date.now() - posted.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays > JOB_MAX_AGE_DAYS;
};

export const getGlobalJobs = async (queryStr: string, location: string): Promise<any[] | null> => {
  const cacheId = `${queryStr.toLowerCase().replace(/\s+/g, '_')}_${location.toLowerCase().replace(/\s+/g, '_')}`;
  const docRef = doc(db, 'global_jobs', cacheId);

  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const lastUpdated: Date = data.updatedAt?.toDate() || new Date(0);
    const ageDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    // Cache expired after 7 days — force a fresh fetch
    if (ageDays >= CACHE_TTL_DAYS) {
      console.log(`[JobCache] Expired (${ageDays.toFixed(1)} days old), refreshing: ${cacheId}`);
      return null;
    }

    // Filter out stale job listings older than 7 days
    const freshJobs = (data.jobs || []).filter((j: any) => !isJobStale(j));
    const purged = (data.jobs || []).length - freshJobs.length;

    if (purged > 0) {
      console.log(`[JobCache] Purged ${purged} stale jobs from cache: ${cacheId}`);
      // Silently update cache with purged results
      setDoc(docRef, { ...data, jobs: freshJobs, updatedAt: serverTimestamp() }).catch(() => {});
    }

    if (freshJobs.length === 0) return null; // All jobs stale, refetch

    console.log(`[JobCache] HIT — ${freshJobs.length} jobs, ${ageDays.toFixed(1)} days old: ${cacheId}`);
    return freshJobs;
  } catch (e) {
    // Permissions error or offline — degrade gracefully, fetch fresh
    console.warn('[JobCache] Read failed (offline/permissions), fetching live:', e);
    return null;
  }
};

export const saveGlobalJobs = async (queryStr: string, location: string, jobs: any[]): Promise<void> => {
  const cacheId = `${queryStr.toLowerCase().replace(/\s+/g, '_')}_${location.toLowerCase().replace(/\s+/g, '_')}`;
  const docRef = doc(db, 'global_jobs', cacheId);

  // Strip stale jobs before persisting
  const freshJobs = jobs.filter((j: any) => !isJobStale(j));

  try {
    await setDoc(docRef, {
      jobs: freshJobs,
      updatedAt: serverTimestamp(),
      cachedAt: serverTimestamp(),
      query: queryStr,
      location,
      jobCount: freshJobs.length,
    });
    console.log(`[JobCache] Saved ${freshJobs.length} fresh jobs: ${cacheId}`);
  } catch (e) {
    // Non-fatal — app works fine without caching
    console.warn('[JobCache] Save skipped (offline/permissions):', e);
  }
};

// --- Per-User Daily Fetch Limit ---

export const canUserFetchJobs = async () => {
  const user = auth.currentUser;
  if (!user) return false;

  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  
  if (userDoc.exists()) {
    const data = userDoc.data();
    const lastFetchDate = data.lastJobFetchDate?.toDate()?.toDateString();
    const today = new Date().toDateString();
    
    if (lastFetchDate === today) {
      if (data.dailyFetchCount >= 5) { // Giving them 5 instead of 3 as a buffer
        return false;
      }
      await updateDoc(userDocRef, {
        dailyFetchCount: increment(1)
      });
    } else {
      await updateDoc(userDocRef, {
        lastJobFetchDate: serverTimestamp(),
        dailyFetchCount: 1
      });
    }
  }
  return true;
};

// Get referred users list
export const getReferredUsers = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const q = query(
    collection(db, 'users'),
    where('referredBy', '==', currentUser.uid)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || 'Anonymous User',
    email: doc.data().email || '',
    profilePic: doc.data().profilePic || null,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// --- Chat Session History ---

export const saveChatSession = async (chatData: {
  messages: any[];
  collectedAnswers: any;
  resumeData?: any;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const chatCollection = collection(db, 'users', user.uid, 'chat_history');
  
  const q = query(chatCollection);
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

  docs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  
  // Keep the last 10 chat sessions
  if (docs.length >= 10) {
    const oldest = docs[0];
    await deleteDoc(doc(db, 'users', user.uid, 'chat_history', oldest.id));
  }

  const docRef = await addDoc(chatCollection, {
    ...chatData,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
};

export const getChatSessions = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(
    collection(db, 'users', user.uid, 'chat_history')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

