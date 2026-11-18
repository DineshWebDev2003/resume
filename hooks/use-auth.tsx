import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { API_CONFIG } from '@/constants/config';
import { auth, db } from '../services/firebase';
import { checkAndInitProfile, UserProfile } from '../services/firestore';
import { betterAuthGetSession, betterAuthSignOut } from '@/services/betterAuthClient';
import { applyLocalPremiumOverride, fetchCloudflareEntitlements } from '@/services/entitlements';

export type AppAuthUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  provider: 'firebase' | 'better-auth';
  raw?: any;
};

type AuthContextValue = {
  user: AppAuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setAuthUser: (user: AppAuthUser | null) => Promise<void>;
  signOut: () => Promise<void>;
};

const AUTH_USER_KEY = 'auth_user_v1';
const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

function useCloudflareAuth() {
  return (API_CONFIG as any).AUTH_PROVIDER === 'better-auth';
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = async (u: AppAuthUser | null) => {
    if (u) await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
    else await AsyncStorage.removeItem(AUTH_USER_KEY);
  };

  const setAuthUser = async (u: AppAuthUser | null) => {
    setUser(u);
    await persist(u);
    if (!u) setUserProfile(null);
  };

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    async function initBetterAuth() {
      try {
        const cached = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (cached) setUser(JSON.parse(cached));
        try {
          const session = await betterAuthGetSession();
          const u = session?.user ?? session?.data?.user;
          if (u?.id) {
            const appUser: AppAuthUser = { uid: u.id, email: u.email, displayName: u.name, photoURL: u.image, provider: 'better-auth' };
            await setAuthUser(appUser);
            try {
              const ent = await fetchCloudflareEntitlements();
              if (ent) {
                setUserProfile({
                  userId: ent.id,
                  name: ent.name || u.name || 'User',
                  email: ent.email || u.email || '',
                  jobRoles: [],
                  location: '',
                  education: '',
                  resumeLimit: ent.resumeLimit,
                  referralCode: `RESUME-${String(ent.id).slice(0,5).toUpperCase()}`,
                  referralCount: 0,
                  onboardingCompleted: !!ent.onboardingCompleted,
                  isPro: ent.isPro,
                  isPremium: ent.isPremium,
                  plan: ent.plan,
                } as any);
              } else {
                const premium = applyLocalPremiumOverride({ id: u.id, isPro: false, isPremium: false, resumeLimit: 3 }, u.email);
                setUserProfile({ userId: u.id, name: u.name || 'User', email: u.email || '', jobRoles: [], location: '', education: '', resumeLimit: premium.resumeLimit, referralCode: '', referralCount: 0, onboardingCompleted: false, isPro: premium.isPro, isPremium: premium.isPremium, plan: premium.plan } as any);
              }
            } catch {
              const premium = applyLocalPremiumOverride({ id: u.id, isPro: false, isPremium: false, resumeLimit: 3 }, u.email);
              setUserProfile({ userId: u.id, name: u.name || 'User', email: u.email || '', jobRoles: [], location: '', education: '', resumeLimit: premium.resumeLimit, referralCode: '', referralCount: 0, onboardingCompleted: false, isPro: premium.isPro, isPremium: premium.isPremium, plan: premium.plan } as any);
            }
          } else if (!cached) {
            await setAuthUser(null);
          }
        } catch {
          // keep cached session for offline startup; server will enforce auth
        }
      } finally {
        setLoading(false);
      }
    }

    if (useCloudflareAuth()) {
      initBetterAuth();
      return () => unsubProfile?.();
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (unsubProfile) unsubProfile();
      try {
        if (firebaseUser) {
          const appUser: AppAuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            provider: 'firebase',
            raw: firebaseUser,
          };
          setUser(appUser);
          await checkAndInitProfile(firebaseUser as any);
          const userRef = doc(db, 'users', firebaseUser.uid);
          unsubProfile = onSnapshot(userRef, async (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              if (!profileData.photoURL && firebaseUser.photoURL) profileData.photoURL = firebaseUser.photoURL;
              setUserProfile(profileData);
              AsyncStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileData));
            } else {
              try {
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                  setUserProfile(snap.data() as UserProfile);
                  AsyncStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(snap.data()));
                }
              } catch {}
            }
            setLoading(false);
          }, async (_error) => {
            // Graceful fallback if security rules deny onSnapshot
            try {
              const cached = await AsyncStorage.getItem(`user_profile_${firebaseUser.uid}`);
              if (cached) {
                setUserProfile(JSON.parse(cached));
              } else {
                setUserProfile({
                  userId: firebaseUser.uid,
                  name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || '',
                  jobRoles: [],
                  location: '',
                  education: '',
                  resumeLimit: 3,
                  referralCode: `RESUME-${firebaseUser.uid.substring(0, 5).toUpperCase()}`,
                  referralCount: 0,
                  onboardingCompleted: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as any);
              }
            } catch {}
            setLoading(false);
          });
        } else {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signOut = async () => {
    try {
      if (user?.provider === 'better-auth' || useCloudflareAuth()) await betterAuthSignOut();
    } catch {}
    try { await auth.signOut(); } catch {}
    await setAuthUser(null);
  };

  return <AuthContext.Provider value={{ user, userProfile, loading, setAuthUser, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
