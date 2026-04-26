import { db, auth } from './firebase';
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
  profilePic?: string;
  resumeLimit: number;
  referralCode: string;
  referralCount: number;
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
  await updateDoc(userDocRef, {
    ...data,
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
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

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
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    appliedAt: doc.data().appliedAt?.toDate() || new Date()
  })).sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
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

  // 4. Update current user: +1 resume slot, set referredBy
  await updateDoc(userDocRef, {
    resumeLimit: increment(1),
    referredBy: referrerId,
    updatedAt: serverTimestamp(),
  });

  return true;
};
