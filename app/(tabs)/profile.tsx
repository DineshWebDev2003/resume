import React, { useState, useEffect, useCallback } from "react";
import { Colors, Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme, useThemeStore } from "@/hooks/use-color-scheme";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
    Bell,
    Bookmark,
    Briefcase,
    Camera,
    ChevronRight,
    Crown,
    FileText,
    Gift,
    Globe,
    GraduationCap,
    HelpCircle,
    LogOut,
    MapPin,
    Moon,
    Plus,
    Settings,
    Share2,
    Shield,
    Trash2,
    UserCircle,
    Users,
    X,
    Download,
    Rocket,
    CreditCard,
    Sun,
    CheckCircle2,
    Sparkles,
    Phone
} from "lucide-react-native";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
    Clipboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "@/constants/config";
import { exportToPDF } from "@/utils/resume-exporter";
import { uploadToCloudinary } from "@/services/cloudinary";
import { updateUserProfile, applyReferralCode, incrementResumeLimit, getReferredUsers } from "@/services/firestore";
import { updateUserPhoto, signOut } from "@/services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { UserStorage, type PreferredProvider } from "@/services/storage";
import { getAIProviderStatus, type ProviderLinkStatus } from "@/services/ai";
import { getResumes } from "@/utils/storage";

const { width } = Dimensions.get("window");



// Retrieve device timezone country and localized pricing
export const getCountryBasedPricing = () => {
  let timezone = "";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (e) {}

  const tz = timezone.toLowerCase();
  
  if (tz.includes("asia/kolkata") || tz.includes("india") || tz.includes("calcutta")) {
    return {
      currency: "INR",
      symbol: "₹",
      monthlyPrice: "₹99",
      weeklyPrice: "₹29",
      annualPrice: "₹599",
      monthlyVal: 99,
      weeklyVal: 29,
      annualVal: 599,
      country: "India",
      discountBadge: "Save 50%"
    };
  } else if (tz.includes("europe") || tz.includes("london") || tz.includes("paris") || tz.includes("berlin") || tz.includes("dublin") || tz.includes("rome") || tz.includes("madrid")) {
    return {
      currency: "EUR",
      symbol: "€",
      monthlyPrice: "€4.99",
      weeklyPrice: "€1.49",
      annualPrice: "€29.99",
      monthlyVal: 4.99,
      weeklyVal: 1.49,
      annualVal: 29.99,
      country: "Europe",
      discountBadge: "Save 50%"
    };
  } else if (tz.includes("gb") || tz.includes("london")) {
    return {
      currency: "GBP",
      symbol: "£",
      monthlyPrice: "£3.99",
      weeklyPrice: "£0.99",
      annualPrice: "£23.99",
      monthlyVal: 3.99,
      weeklyVal: 0.99,
      annualVal: 23.99,
      country: "United Kingdom",
      discountBadge: "Save 50%"
    };
  }
  
  // Default fallback (Set to India since timezone extraction can be unreliable in React Native)
  return {
    currency: "INR",
    symbol: "₹",
    monthlyPrice: "₹99",
    weeklyPrice: "₹29",
    annualPrice: "₹599",
    monthlyVal: 99,
    weeklyVal: 29,
    annualVal: 599,
    country: "India",
    discountBadge: "Save 50%"
  };
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { toggleTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  
  const pricing = getCountryBasedPricing();

  const [notifications, setNotifications] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [resumeLimit, setResumeLimit] = useState(3);
  const [activeResumesCount, setActiveResumesCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Profile Data States
  const [name, setName] = useState(user?.displayName || "User");
  const [email, setEmail] = useState(user?.email || "");
  const [profilePic, setProfilePic] = useState<string | null>(user?.photoURL || null);
  const [jobRoles, setJobRoles] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [education, setEducation] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [phone, setPhone] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [subPlan, setSubPlan] = useState("");
  const [subExpiry, setSubExpiry] = useState<any>(null);

  // API Key States
  const [userGroqKey, setUserGroqKey] = useState("");
  const [userGeminiKey, setUserGeminiKey] = useState("");
  const [userPollinationsKey, setUserPollinationsKey] = useState("");
  const [userLlamaKey, setUserLlamaKey] = useState("");
  const [userPreferredProvider, setUserPreferredProvider] = useState<PreferredProvider>("auto");
  const [aiChainStatus, setAiChainStatus] = useState<ProviderLinkStatus[] | null>(null);
  const [aiChainLoading, setAiChainLoading] = useState(false);

  // Referral States
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Billing States
  const [iapConnected, setIapConnected] = useState(false);
  const [iapProducts, setIapProducts] = useState<any[]>([]);
  const [loadingIap, setLoadingIap] = useState(false);
  const [subBillingPeriod, setSubBillingPeriod] = useState<"monthly" | "weekly">("monthly");
  const [simulatedPaying, setSimulatedPaying] = useState(false);
  const periodRef = React.useRef<"monthly" | "weekly">(subBillingPeriod);
  periodRef.current = subBillingPeriod;

  useEffect(() => {
    if (activeModal === "My Referrals") {
      const fetchReferrals = async () => {
        setLoadingReferrals(true);
        try {
          const list = await getReferredUsers();
          setReferredUsers(list);
        } catch (e) {
          console.log("Error fetching referred users:", e);
        } finally {
          setLoadingReferrals(false);
        }
      };
      fetchReferrals();
    }
    if (activeModal === "API Configuration") {
      setAiChainLoading(true);
      getAIProviderStatus()
        .then(setAiChainStatus)
        .catch(() => setAiChainStatus(null))
        .finally(() => setAiChainLoading(false));
    }
  }, [activeModal]);

  useEffect(() => {
    let purchaseUpdate: any = null;
    let purchaseError: any = null;
    let IAPRef: any = null;
    const initIap = async () => {
      try {
        setLoadingIap(true);
        // Dynamically require react-native-iap to prevent any runtime compile-time errors in Expo Go
        // v15 API: initConnection + fetchProducts({skus, type:'subs'})
        const IAP = require('react-native-iap');
        IAPRef = IAP;
        if (!IAP || typeof IAP.initConnection !== 'function' || typeof IAP.fetchProducts !== 'function') {
          console.log("[IAP] Native billing module not available in this host (e.g. Expo Go). Falling back to sandbox.");
          return;
        }

        const connected = await IAP.initConnection();
        setIapConnected(!!connected);
        if (connected) {
          try {
            const products = await IAP.fetchProducts({ skus: ['pro_plan'], type: 'subs' });
            setIapProducts(products || []);
            console.log("[IAP] Successfully fetched pro_plan subscription details:", products);
            try {
              const p: any = (products || [])[0];
              const offers = p?.subscriptionOfferDetailsAndroid || p?.subscriptionOfferDetails || [];
              console.log("[IAP] Offers:", offers.map((o: any) => ({
                basePlanId: o.basePlanId,
                hasToken: !!o.offerToken,
                price: o?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice,
              })));
            } catch {}
          } catch (err) {
            console.log("[IAP] Error fetching subscriptions details:", err);
          }
          // Real purchase verification: grant Pro ONLY on Play purchase events.
          if (typeof IAP.purchaseUpdatedListener === 'function') {
            purchaseUpdate = IAP.purchaseUpdatedListener(async (purchase: any) => {
              try {
                const pid = purchase?.productId || purchase?.id || (purchase?.productIds || [])[0];
                console.log("[IAP] Purchase event:", pid, purchase?.transactionId);
                if (typeof IAP.finishTransaction === 'function') {
                  await IAP.finishTransaction({ purchase, isConsumable: false });
                }
                if (pid === 'pro_plan') {
                  const { auth } = require('@/services/firebase');
                  const u = auth?.currentUser;
                  if (u) {
                    const { doc, updateDoc } = require('firebase/firestore');
                    const { db } = require('@/services/firebase');
                    const period = periodRef.current;
                    const expiry = new Date(Date.now() + (period === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString();
                    await updateDoc(doc(db, 'users', u.uid), { isPro: true, subPlan: period, subExpiry: expiry });
                    setIsPro(true);
                    setSubPlan(period);
                    setSubExpiry(expiry);
                    Alert.alert("Success 🎉", "Elite Pro activated! Enjoy unlimited exports.");
                    setActiveModal(null);
                  }
                }
              } catch (e) {
                console.log("[IAP] Finish/grant error:", e);
              }
            });
          }
          if (typeof IAP.purchaseErrorListener === 'function') {
            purchaseError = IAP.purchaseErrorListener((err: any) => {
              console.log("[IAP] Purchase error event:", err?.code, err?.message);
            });
          }
        }
      } catch (e) {
        console.warn("[IAP] Connection to Google Play Store failed:", e);
      } finally {
        setLoadingIap(false);
      }
    };
    initIap();
    return () => {
      try { purchaseUpdate?.remove(); } catch {}
      try { purchaseError?.remove(); } catch {}
      try { IAPRef?.endConnection?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.name) setName(data.name);
            if (data.profilePic) setProfilePic(data.profilePic);
            if (data.jobRoles) setJobRoles(data.jobRoles);
            if (data.location) setLocation(data.location);
            if (data.education) setEducation(data.education);
            if (data.portfolio) setPortfolio(data.portfolio);
            if (data.phone) setPhone(data.phone);
            if (data.referralCode) setReferralCode(data.referralCode);
            if (data.resumeLimit) {
              setResumeLimit(data.resumeLimit);
              await AsyncStorage.setItem('cached_resume_limit', String(data.resumeLimit));
            }
            if (data.referralCount) setReferralCount(data.referralCount);
            if (data.isPro !== undefined) setIsPro(data.isPro);
            if (data.subPlan) setSubPlan(data.subPlan);
            if (data.subExpiry) setSubExpiry(data.subExpiry);
            if (data.groqKey !== undefined) {
              setUserGroqKey(data.groqKey);
              await UserStorage.saveGroqKey(data.groqKey);
            }
            if (data.geminiKey !== undefined) {
              setUserGeminiKey(data.geminiKey);
              await UserStorage.saveGeminiKey(data.geminiKey);
            }
            if ((data as any).pollinationsKey !== undefined) {
              setUserPollinationsKey((data as any).pollinationsKey);
              await UserStorage.savePollinationsKey((data as any).pollinationsKey);
            }
            if ((data as any).llamaKey !== undefined) {
              setUserLlamaKey((data as any).llamaKey);
              await UserStorage.saveLlamaKey((data as any).llamaKey);
            }
            if ((data as any).preferredProvider) {
              const p = (data as any).preferredProvider as PreferredProvider;
              setUserPreferredProvider(p);
              await UserStorage.savePreferredProvider(p);
            }
          }
        } catch (error) {
          console.log("Firestore Fetch error:", error);
        }
      }
    };
    fetchProfile();
    
    // Fetch active resumes count
    const loadResumesCount = async () => {
      try {
        const list = await getResumes();
        setActiveResumesCount(list.length);
      } catch (e) {
        console.log("Error fetching resumes count in profile:", e);
      }
    };
    loadResumesCount();
    
    // Fetch user keys
    const fetchKeys = async () => {
      const groq = await UserStorage.getGroqKey();
      const gemini = await UserStorage.getGeminiKey();
      const polli = await UserStorage.getPollinationsKey();
      const llama = await UserStorage.getLlamaKey();
      const pref = await UserStorage.getPreferredProvider();
      if (groq) setUserGroqKey(groq);
      if (gemini) setUserGeminiKey(gemini);
      if (polli) setUserPollinationsKey(polli);
      if (llama) setUserLlamaKey(llama);
      setUserPreferredProvider(pref);
    };
    fetchKeys();
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);
      try {
        setIsUploading(true);
        const cloudinaryData = await uploadToCloudinary(uri);
        const cloudinaryUrl = cloudinaryData.url;
        setProfilePic(cloudinaryUrl);
        await updateUserPhoto(cloudinaryUrl);
        await updateUserProfile({ profilePic: cloudinaryUrl });
        Alert.alert("Success", "Profile photo updated!");
      } catch (error) {
        Alert.alert("Error", "Could not upload image.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => {
          await signOut();
          router.replace("/login");
        } 
      }
    ]);
  };

  const menuItems = [
    { icon: UserCircle, label: "Edit Profile", sub: "Name, roles, location" },
    { icon: Gift, label: "Redeem Code", sub: "Unlock extra exports" },
    { icon: FileText, label: "My Resumes", sub: "Manage your documents" },
    { icon: Briefcase, label: "My Jobs", sub: "Applied & Saved opportunities" },
    { icon: Users, label: "My Referrals", sub: "See who you invited" },
    { icon: CreditCard, label: "Subscription", sub: "Plan & Billing" },
    { icon: Shield, label: "API Configuration", sub: "Use your own AI keys" },
    { icon: Rocket, label: "Onboarding", sub: "Re-run setup wizard" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Elite Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder, borderWidth: 1 }]}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: Theme.colors.primary }]}>
                <Text style={styles.avatarInitial}>{name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Camera size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileMeta}>
            <Text style={[styles.profileName, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{email}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.proBadge, !isPro && { backgroundColor: colors.textMuted }]}>
                {isPro ? <Crown size={10} color="#fff" /> : <Shield size={10} color="#fff" />}
                <Text style={styles.proBadgeText}>
                  {isPro ? `PRO ELITE${subPlan ? ` (${subPlan.toUpperCase()})` : ''}` : 'FREE PLAN'}
                </Text>
              </View>
              {isPro && subExpiry && (() => {
                try {
                  const expiryDate = subExpiry.toDate ? subExpiry.toDate() : new Date(subExpiry);
                  const diffTime = expiryDate.getTime() - new Date().getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays > 0) {
                    return (
                      <View style={[styles.proBadge, { backgroundColor: Theme.colors.secondary }]}>
                        <Text style={styles.proBadgeText}>{diffDays} Days Left</Text>
                      </View>
                    );
                  }
                  return null;
                } catch(e) { return null; }
              })()}
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder, borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: Theme.colors.primary }]}>
              {resumeLimit >= 1000 ? "Unlimited" : Math.max(0, resumeLimit - activeResumesCount)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Exports Left</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder, borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: Theme.colors.secondary }]}>{referralCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Referrals</Text>
          </View>
        </View>

        {/* Referral Card */}
        <TouchableOpacity style={styles.referralCard} onPress={() => {
          Share.share({ message: `Build elite resumes! Use my code: ${referralCode}` });
        }}>
          <LinearGradient colors={isDark ? ['#d97706', '#92400e'] : ['#f59e0b', '#ea580c']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.referralGradient}>
            <View>
              <Text style={styles.referTitle}>Refer & Earn</Text>
              <Text style={styles.referSub}>Invite friends to get +2 exports</Text>
            </View>
            <View style={styles.referCodeBox}>
              <Text style={styles.referCode}>{referralCode || "..."}</Text>
              <Share2 size={16} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Personal Info */}
        {(location || education || jobRoles.filter(Boolean).length > 0) ? (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PERSONAL INFO</Text>
            <View style={[styles.groupedContainer, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              {location ? (
                <View style={[styles.groupedItem, { borderBottomWidth: (education || jobRoles.filter(Boolean).length > 0) ? 1 : 0, borderBottomColor: colors.glassBorder }]}>
                  <View style={[styles.itemIconBox, { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.colors.primary + '10' }]}>
                    <MapPin size={18} color={Theme.colors.primary} />
                  </View>
                  <Text style={[styles.linkText, { color: colors.text, marginLeft: 12, flex: 1 }]} numberOfLines={1}>{location}</Text>
                </View>
              ) : null}
              {education ? (
                <View style={[styles.groupedItem, { borderBottomWidth: jobRoles.filter(Boolean).length > 0 ? 1 : 0, borderBottomColor: colors.glassBorder }]}>
                  <View style={[styles.itemIconBox, { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.colors.primary + '10' }]}>
                    <GraduationCap size={18} color={Theme.colors.primary} />
                  </View>
                  <Text style={[styles.linkText, { color: colors.text, marginLeft: 12, flex: 1 }]} numberOfLines={1}>{education}</Text>
                </View>
              ) : null}
              {jobRoles.filter(Boolean).length > 0 ? (
                <View style={[styles.groupedItem]}>
                  <View style={[styles.itemIconBox, { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.colors.primary + '10' }]}>
                    <Briefcase size={18} color={Theme.colors.primary} />
                  </View>
                  <Text style={[styles.linkText, { color: colors.text, marginLeft: 12, flex: 1 }]} numberOfLines={1}>{jobRoles.filter(Boolean).join(', ')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Professional Info */}
        {(portfolio || phone) ? (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PROFESSIONAL INFO</Text>
            <View style={[styles.groupedContainer, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              {portfolio ? (
                <View style={[styles.groupedItem, { borderBottomWidth: phone ? 1 : 0, borderBottomColor: colors.glassBorder }]}>
                  <View style={[styles.itemIconBox, { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.colors.primary + '10' }]}>
                    <Globe size={18} color={Theme.colors.primary} />
                  </View>
                  <Text style={[styles.linkText, { color: colors.text, marginLeft: 12, flex: 1 }]} numberOfLines={1}>{portfolio.replace('https://','')}</Text>
                </View>
              ) : null}
              {phone ? (
                <View style={[styles.groupedItem]}>
                  <View style={[styles.itemIconBox, { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.colors.primary + '10' }]}>
                    <Phone size={18} color={Theme.colors.primary} />
                  </View>
                  <Text style={[styles.linkText, { color: colors.text, marginLeft: 12, flex: 1 }]} numberOfLines={1}>{phone}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Seamless Settings Menu */}
        <View style={styles.seamlessContainer}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              activeOpacity={0.7}
              onPress={() => {
                if (item.label === "My Resumes") router.push("/my-resumes");
                else if (item.label === "My Jobs") router.push("/my-jobs");
                else if (item.label === "Onboarding") router.push("/onboarding");
                else setActiveModal(item.label);
              }}
              style={styles.simpleMenuItem}
            >
              <item.icon size={24} color={Theme.colors.primary} strokeWidth={2.5} />
              <Text style={[styles.simpleMenuLabel, { color: colors.text }]}>{item.label}</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Professional Links - Seamless removed */}

        {/* Logout */}
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Re-usable Modal */}
      <Modal visible={activeModal !== null} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={[styles.modalHeader, { paddingHorizontal: 25, marginTop: 15 }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{activeModal}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorder, borderWidth: 1 }]}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeModal === "Edit Profile" && (
                <View style={[styles.editForm, { paddingHorizontal: 25 }]}>
                  
                  {/* Premium Profile Picture Uploader Container */}
                  <View style={styles.modalAvatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.modalAvatarWrapper} activeOpacity={0.85}>
                      {isUploading ? (
                        <View style={[styles.modalAvatar, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }]}>
                          <ActivityIndicator size="large" color="#fff" />
                        </View>
                      ) : profilePic ? (
                        <Image source={{ uri: profilePic }} style={styles.modalAvatar} />
                      ) : (
                        <View style={[styles.modalAvatar, { backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={styles.modalAvatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={[styles.modalCameraBadge, { backgroundColor: Theme.colors.secondary }]}>
                        <Camera size={14} color="#fff" />
                      </View>
                    </TouchableOpacity>
                    <Text style={[styles.modalAvatarHint, { color: colors.textMuted }]}>
                      {isUploading ? "Uploading to Cloud..." : "Tap photo to change profile picture"}
                    </Text>
                  </View>

                  <View style={styles.modalSubHeader}>
                    <Text style={[styles.modalSubTitle, { color: colors.text }]}>Personal Details</Text>
                    <Text style={[styles.modalDesc, { color: colors.textMuted }]}>Keep your professional profile up to date</Text>
                  </View>

                  <View style={styles.fieldsGridNew}>
                    <Field label="Full Name" value={name} onChange={setName} colors={colors} placeholder="Enter your full name" icon={UserCircle} />
                    <Field label="Location" value={location} onChange={setLocation} colors={colors} placeholder="e.g. San Francisco, CA" icon={MapPin} />
                    <Field label="Education" value={education} onChange={setEducation} colors={colors} placeholder="e.g. Stanford University" icon={GraduationCap} />
                  </View>
                  
                  <View style={styles.roleSection}>
                    <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 12, fontWeight: '700', fontSize: 14 }]}>Professional Info</Text>
                    <View style={styles.fieldsGridNew}>
                      <Field label="Portfolio URL" value={portfolio} onChange={setPortfolio} colors={colors} placeholder="https://yourportfolio.com" icon={Globe} />
                      <Field label="Mobile Number" value={phone} onChange={setPhone} colors={colors} placeholder="Enter mobile number" icon={Phone} />
                    </View>
                  </View>

                  <View style={styles.roleSection}>
                    <View style={styles.roleHeader}>
                      <Text style={[styles.fieldLabel, { color: colors.text, fontWeight: '600' }]}>Job Roles</Text>
                      <TouchableOpacity 
                        style={[styles.addRoleBtn, { backgroundColor: Theme.colors.primary + '20' }]} 
                        onPress={() => setJobRoles([...jobRoles, ""])}
                      >
                        <Plus size={16} color={Theme.colors.primary} />
                        <Text style={[styles.addRoleText, { color: Theme.colors.primary }]}>Add Role</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {jobRoles.map((role, i) => (
                      <View key={i} style={[styles.roleRowCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <TextInput 
                          style={[styles.roleInput, { color: colors.text }]} 
                          value={role} 
                          placeholder="e.g. Senior Frontend Engineer"
                          placeholderTextColor={colors.textMuted}
                          onChangeText={(t) => {
                            const n = [...jobRoles];
                            n[i] = t;
                            setJobRoles(n);
                          }}
                        />
                        <TouchableOpacity 
                          onPress={() => setJobRoles(jobRoles.filter((_, idx) => idx !== i))}
                          style={styles.deleteRoleBtn}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: Theme.colors.primary }]} 
                    onPress={async () => {
                      await updateUserProfile({ name, location, education, jobRoles, portfolio, phone });
                      Alert.alert("Success", "Profile updated successfully!");
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.saveBtnText}>Save Profile</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeModal === "Redeem Code" && (
                <View style={[styles.editForm, { paddingHorizontal: 25 }]}>
                  <View style={styles.modalSubHeader}>
                    <Text style={[styles.modalSubTitle, { color: colors.text }]}>Enter Code</Text>
                    <Text style={[styles.modalDesc, { color: colors.textMuted }]}>Unlock extra resume exports with a referral code</Text>
                  </View>

                  <View style={[styles.redeemCardContainer, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.modalHint, { color: colors.textMuted, marginBottom: 15 }]}>
                      Enter a referral code to get +2 extra export limit.
                    </Text>
                    <TextInput 
                      style={[styles.redeemInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.glassBorder }]}
                      value={redeemCode}
                      onChangeText={(t) => setRedeemCode(t.toUpperCase())}
                      placeholder="ENTER CODE"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: Theme.colors.primary }, isRedeeming && { opacity: 0.7 }]} 
                    disabled={isRedeeming}
                    onPress={async () => {
                      if (!redeemCode.trim()) {
                        Alert.alert("Error", "Please enter a valid code.");
                        return;
                      }
                      setIsRedeeming(true);
                      try {
                        await applyReferralCode(redeemCode);
                        const nextLimit = resumeLimit + 2;
                        setResumeLimit(nextLimit);
                        await AsyncStorage.setItem('cached_resume_limit', String(nextLimit));
                        Alert.alert("Success 🎉", "Code applied! You got +2 free resume exports!");
                        setActiveModal(null);
                      } catch (e: any) {
                        Alert.alert("Error", e.message);
                      } finally {
                        setIsRedeeming(false);
                      }
                    }}
                  >
                    {isRedeeming ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Redeem Now</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {activeModal === "My Referrals" && (
                <View style={[styles.editForm, { paddingHorizontal: 25 }]}>
                  <View style={styles.modalSubHeader}>
                    <Text style={[styles.modalSubTitle, { color: colors.text }]}>Invite Friends</Text>
                    <Text style={[styles.modalDesc, { color: colors.textMuted }]}>Get +2 free resume exports for every friend who joins!</Text>
                  </View>

                  <View style={[styles.referralPromoCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.referralPromoLabel, { color: colors.textMuted }]}>YOUR REFERRAL CODE</Text>
                    <View style={styles.referralCodeCopyRow}>
                      <Text style={[styles.referralCodeVal, { color: colors.text }]}>
                        {referralCode || user?.uid?.substring(0, 6).toUpperCase() || "ELITE12"}
                      </Text>
                      <TouchableOpacity 
                        style={[styles.copyBtn, { backgroundColor: Theme.colors.primary }]}
                        onPress={() => {
                          const code = referralCode || user?.uid?.substring(0, 6).toUpperCase() || "ELITE12";
                          Clipboard.setString(code);
                          Alert.alert("Copied!", "Referral code copied to clipboard.");
                        }}
                      >
                        <Text style={styles.copyBtnText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.referralStatsOverview}>
                    <View style={[styles.refStatBox, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b50' }]}>
                      <Text style={[styles.refStatVal, { color: '#d97706' }]}>{referredUsers.length}</Text>
                      <Text style={[styles.refStatLabel, { color: '#92400e' }]}>Invited</Text>
                    </View>
                    <View style={[styles.refStatBox, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b50' }]}>
                      <Text style={[styles.refStatVal, { color: '#d97706' }]}>{referredUsers.length * 2}</Text>
                      <Text style={[styles.refStatLabel, { color: '#92400e' }]}>Exports Earned</Text>
                    </View>
                  </View>

                  <Text style={[styles.sectionHeaderTitle, { color: colors.text, marginTop: 15, marginBottom: 10, fontWeight: '600' }]}>
                    Referred Users
                  </Text>

                  {loadingReferrals ? (
                    <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 20 }} />
                  ) : referredUsers.length === 0 ? (
                    <View style={[styles.emptyReferralContainer, { borderColor: colors.glassBorder }]}>
                      <Users size={32} color={colors.textMuted} />
                      <Text style={[styles.emptyReferralText, { color: colors.textMuted }]}>No friends invited yet. Share your code to start earning!</Text>
                    </View>
                  ) : (
                    <View style={[styles.referralListCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                      {referredUsers.map((item, index) => (
                        <View 
                          key={index} 
                          style={[
                            styles.referralItemRow, 
                            { borderBottomWidth: index === referredUsers.length - 1 ? 0 : 1, borderBottomColor: colors.glassBorder }
                          ]}
                        >
                          <View style={styles.referralItemInfo}>
                            <Text style={[styles.referralItemName, { color: colors.text }]}>{item.name || "Anonymous Friend"}</Text>
                            <Text style={[styles.referralItemDate, { color: colors.textMuted }]}>
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently Joined"}
                            </Text>
                          </View>
                          <View style={[styles.referralStatusBadge, { backgroundColor: '#10b98120' }]}>
                            <Text style={[styles.referralStatusText, { color: '#10b981' }]}>+2 Exports</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {activeModal === "Subscription" && (() => {
                // v15 product shape: id + subscriptionOfferDetailsAndroid
                const findSubProduct = () =>
                  iapProducts.find((p: any) => (p.id || p.productId) === 'pro_plan');
                const findOffers = (subProduct: any) =>
                  subProduct?.subscriptionOfferDetailsAndroid ||
                  subProduct?.subscriptionOfferDetails || [];
                // Play basePlanIds may differ from our labels — match smartly, else first offer.
                const findOffer = (offers: any[], period: "monthly" | "weekly") => {
                  if (!offers.length) return null;
                  const keys = period === "monthly" ? ["month"] : ["week"];
                  return (
                    offers.find((o: any) => o.basePlanId === period) ||
                    offers.find((o: any) =>
                      keys.some((k) => String(o.basePlanId || "").toLowerCase().includes(k)),
                    ) ||
                    offers[0]
                  );
                };
                const getDisplayPrice = (period: "monthly" | "weekly") => {
                  const subProduct = findSubProduct();
                  const offers = findOffers(subProduct);
                  if (offers.length > 0) {
                    const offer = findOffer(offers, period);
                    if (offer && offer.pricingPhases && offer.pricingPhases.pricingPhaseList && offer.pricingPhases.pricingPhaseList[0]) {
                      return offer.pricingPhases.pricingPhaseList[0].formattedPrice;
                    }
                  }
                  return period === "monthly" ? pricing.monthlyPrice : pricing.weeklyPrice;
                };

                return (
                  <View style={styles.pricingContainer}>
                    <View style={{ paddingHorizontal: 25, gap: 20 }}>
                      
                      {/* Interactive Period Selector */}
                      <View style={[styles.periodSelectorBg, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <TouchableOpacity 
                          style={[styles.periodBtn, subBillingPeriod === "monthly" && [styles.periodBtnActive, { backgroundColor: Theme.colors.primary }]]}
                          onPress={() => setSubBillingPeriod("monthly")}
                        >
                          <Text style={[styles.periodBtnText, { color: subBillingPeriod === "monthly" ? "#fff" : colors.textMuted }]}>Monthly Plan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.periodBtn, subBillingPeriod === "weekly" && [styles.periodBtnActive, { backgroundColor: Theme.colors.primary }]]}
                          onPress={() => setSubBillingPeriod("weekly")}
                        >
                          <Text style={[styles.periodBtnText, { color: subBillingPeriod === "weekly" ? "#fff" : colors.textMuted }]}>Weekly Plan</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Subscription Card Design */}
                      <LinearGradient colors={isDark ? ['#1e1b4b', '#311042'] : ['#e0e7ff', '#f3e8ff']} style={[styles.premiumCardNew, { borderColor: Theme.colors.primary }]}>
                        <View style={styles.cardHeaderBadge}>
                          <Crown size={12} color="#fff" />
                          <Text style={styles.cardHeaderBadgeText}>RECOMMENDED</Text>
                        </View>

                        <View style={styles.premiumHeader}>
                          <Crown size={36} color={Theme.colors.primary} />
                          <View>
                            <Text style={[styles.premiumTitleNew, { color: colors.text }]}>Elite Pro Access</Text>
                            <Text style={[styles.premiumSubTitleNew, { color: colors.textMuted }]}>Unlock your full career potential</Text>
                          </View>
                        </View>

                        <View style={styles.priceContainerRow}>
                          <Text style={[styles.premiumPriceNew, { color: colors.text }]}>
                            {getDisplayPrice(subBillingPeriod)}
                          </Text>
                          <Text style={[styles.priceSubNew, { color: colors.textMuted }]}>
                            {subBillingPeriod === "monthly" ? "/month" : "/week"}
                          </Text>
                        </View>

                        <View style={[styles.dividerLine, { backgroundColor: colors.glassBorder }]} />

                        <View style={styles.benefitListNew}>
                          <View style={styles.benefitRowNew}>
                            <View style={[styles.checkCircleBox, { backgroundColor: '#10b98120' }]}>
                              <CheckCircle2 size={14} color="#10b981" />
                            </View>
                            <Text style={[styles.benefitTextNew, { color: colors.text }]}>Unlimited PDF & Resume Exports</Text>
                          </View>
                          <View style={styles.benefitRowNew}>
                            <View style={[styles.checkCircleBox, { backgroundColor: '#10b98120' }]}>
                              <CheckCircle2 size={14} color="#10b981" />
                            </View>
                            <Text style={[styles.benefitTextNew, { color: colors.text }]}>Unlock Premium Templates</Text>
                          </View>
                          <View style={styles.benefitRowNew}>
                            <View style={[styles.checkCircleBox, { backgroundColor: '#10b98120' }]}>
                              <CheckCircle2 size={14} color="#10b981" />
                            </View>
                            <Text style={[styles.benefitTextNew, { color: colors.text }]}>Unlimited AI power-writing credits</Text>
                          </View>
                          <View style={styles.benefitRowNew}>
                            <View style={[styles.checkCircleBox, { backgroundColor: '#10b98120' }]}>
                              <CheckCircle2 size={14} color="#10b981" />
                            </View>
                            <Text style={[styles.benefitTextNew, { color: colors.text }]}>Ad-free seamless editing experience</Text>
                          </View>
                        </View>

                        {/* Safe unmutable/mutable Purchase Button */}
                        <TouchableOpacity 
                          style={[styles.premiumBtnNew, { backgroundColor: Theme.colors.primary }]}
                          disabled={simulatedPaying}
                          onPress={async () => {
                            const IAP = require('react-native-iap');
                            // v15: requestPurchase({request: {google: {...}}, type: 'subs'})
                            if (iapConnected && IAP && typeof IAP.requestPurchase === 'function') {
                              try {
                                setSimulatedPaying(true);
                                const subProduct = findSubProduct();
                                const offers = findOffers(subProduct);
                                if (offers.length > 0) {
                                  const offer = findOffer(offers, subBillingPeriod);
                                  if (offer) {
                                    const offerToken = offer.offerToken || offer.offerTokenAndroid || null;
                                    const basePlanId = offer.basePlanId || '';
                                    console.log("[IAP] Selected offer:", { basePlanId, hasToken: !!offerToken, token: offerToken ? `${offerToken.slice(0,8)}...` : 'NULL' });
                                    if (!offerToken) {
                                      Alert.alert("Error", "Subscription offer has no token. Check Play Console offer setup.");
                                      setSimulatedPaying(false);
                                      return;
                                    }
                                    // Play sheet opens here — Pro is granted by the
                                    // purchase listener ONLY after real payment.
                                    await IAP.requestPurchase({
                                      request: {
                                        google: {
                                          skus: ['pro_plan'],
                                          subscriptionOffers: [{
                                            sku: 'pro_plan',
                                            offerToken,
                                          }],
                                        },
                                      },
                                      type: 'subs',
                                    });
                                    console.log("[IAP] Billing sheet launched, awaiting purchase event...");
                                  } else {
                                    Alert.alert("Error", `Base plan ${subBillingPeriod} offer details not found.`);
                                  }
                                } else {
                                  Alert.alert("Error", "No subscription offers returned from Play. Check Play Console product setup.");
                                }
                              } catch (e: any) {
                                console.log("[IAP] Purchase error:", e);
                                Alert.alert("Purchase Failed", e.message || "Failed to complete purchase. Please try again.");
                              } finally {
                                setSimulatedPaying(false);
                              }
                            } else {
                              // Bypass IAP in development/simulator environment
                              setSimulatedPaying(true);
                              setTimeout(async () => {
                                setSimulatedPaying(false);
                                Alert.alert("Success 🎉", "Subscription processed successfully (Development Mode)!");
                                if (user) {
                                  const { doc, updateDoc } = require('firebase/firestore');
                                  const { db } = require('@/services/firebase');
                                  try {
                                    const expiry = new Date(Date.now() + (subBillingPeriod === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString();
                                    await updateDoc(doc(db, 'users', user.uid), { 
                                      isPro: true,
                                      subPlan: subBillingPeriod,
                                      subExpiry: expiry
                                    });
                                    setIsPro(true);
                                    setSubPlan(subBillingPeriod);
                                    setSubExpiry(expiry);
                                  } catch(e) {}
                                }
                                setActiveModal(null);
                              }, 1500);
                            }
                          }}
                        >
                          {simulatedPaying ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.premiumBtnTextNew}>
                              Subscribe Now ({pricing.country})
                            </Text>
                          )}
                        </TouchableOpacity>
                        {/* Test helper: remove Pro from this account for fresh purchase tests */}
                        <TouchableOpacity
                          onPress={async () => {
                            if (!user) return;
                            try {
                              const { doc, updateDoc } = require('firebase/firestore');
                              const { db } = require('@/services/firebase');
                              await updateDoc(doc(db, 'users', user.uid), { isPro: false, subPlan: '', subExpiry: '' });
                              setIsPro(false);
                              setSubPlan('');
                              setSubExpiry('');
                              Alert.alert("Reset done", "Pro removed from this account. You can now test a fresh purchase.");
                            } catch (e: any) {
                              Alert.alert("Reset failed", e?.message || "Remove isPro in Firebase Console instead.");
                            }
                          }}
                          style={{ marginTop: 12, alignItems: 'center', padding: 10 }}
                        >
                          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' }}>
                            Testing? Remove Pro access
                          </Text>
                        </TouchableOpacity>
                      </LinearGradient>

                    </View>

                  </View>
                );
              })()}

              {activeModal === "Settings" && (
                <View style={[styles.editForm, { paddingHorizontal: 25 }]}>
                  <View style={[styles.settingsItem, { backgroundColor: colors.surface, borderColor: colors.glassBorder, borderWidth: 1 }]}>
                    <Text style={[styles.settingsLabel, { color: colors.text }]}>Dark Mode</Text>
                    <Switch value={isDark} onValueChange={toggleTheme} />
                  </View>
                  <View style={[styles.settingsItem, { backgroundColor: colors.surface, borderColor: colors.glassBorder, borderWidth: 1 }]}>
                    <Text style={[styles.settingsLabel, { color: colors.text }]}>Push Notifications</Text>
                    <Switch value={notifications} onValueChange={setNotifications} />
                  </View>
                </View>
              )}

              {activeModal === "API Configuration" && (
                <View style={[styles.editForm, { paddingHorizontal: 25 }]}>
                  <Text style={[styles.modalHint, { color: colors.textMuted }]}>
                    Enter your own API keys to bypass app limits. You can enter multiple keys separated by commas to enable automatic rotation.
                  </Text>

                  <View style={styles.instructionsBox}>
                    <Text style={[styles.instructionsTitle, { color: colors.text }]}>
                      Fallback chain{aiChainLoading ? " (checking…)" : ""}
                    </Text>
                    {(aiChainStatus || []).map((link, i) => {
                      const dot =
                        link.state === "active"
                          ? "#10b981"
                          : link.state === "ready"
                            ? Theme.colors.primary
                            : link.state === "error"
                              ? "#ef4444"
                              : colors.textMuted;
                      return (
                        <View key={link.id} style={styles.instructionStep}>
                          <View style={[styles.stepDot, { backgroundColor: dot }]} />
                          <Text style={[styles.stepText, { color: colors.textMuted }]}>
                            {i + 1}. {link.label} — {link.detail}
                            {userPreferredProvider !== "auto" && link.id === userPreferredProvider ? " ★" : ""}
                          </Text>
                        </View>
                      );
                    })}
                    <View style={styles.instructionStep}>
                      <View style={[styles.stepDot, { backgroundColor: Theme.colors.primary }]} />
                      <Text style={[styles.stepText, { color: colors.textMuted }]}>
                        Your own keys are always tried first (primary), then shared app keys.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.instructionsBox}>
                    <Text style={[styles.instructionsTitle, { color: colors.text }]}>Use this model</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                      {(
                        [
                          { id: "auto", label: "Auto" },
                          { id: "groq", label: "Groq" },
                          { id: "gemini", label: "Gemini" },
                          { id: "pollinations", label: "Pollinations" },
                          { id: "meta-llama", label: "Meta Llama" },
                        ] as { id: PreferredProvider; label: string }[]
                      ).map((opt) => {
                        const selected = userPreferredProvider === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 9,
                              borderRadius: 12,
                              borderWidth: 1.2,
                              borderColor: selected ? Theme.colors.primary : colors.glassBorder,
                              backgroundColor: selected ? Theme.colors.primary : "transparent",
                            }}
                            onPress={async () => {
                              setUserPreferredProvider(opt.id);
                              try {
                                await UserStorage.savePreferredProvider(opt.id);
                                await updateUserProfile({ preferredProvider: opt.id });
                              } catch {
                                Alert.alert("Error", "Could not save model choice.");
                              }
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "800",
                                color: selected ? "#fff" : colors.text,
                              }}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={[styles.stepText, { color: colors.textMuted, marginTop: 8 }]}>
                      Auto runs the full chain. A selected model is tried first — e.g. pick Meta Llama to use that model — with the rest as backup.
                    </Text>
                  </View>
                  
                  <View style={styles.instructionsBox}>
                    <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to get your keys:</Text>
                    <View style={styles.instructionStep}>
                      <View style={[styles.stepDot, { backgroundColor: Theme.colors.primary }]} />
                      <Text style={[styles.stepText, { color: colors.textMuted }]}>Tap "Get Key" to visit the provider's console.</Text>
                    </View>
                    <View style={styles.instructionStep}>
                      <View style={[styles.stepDot, { backgroundColor: Theme.colors.primary }]} />
                      <Text style={[styles.stepText, { color: colors.textMuted }]}>Create a new API Key and copy it.</Text>
                    </View>
                    <View style={styles.instructionStep}>
                      <View style={[styles.stepDot, { backgroundColor: Theme.colors.primary }]} />
                      <Text style={[styles.stepText, { color: colors.textMuted }]}>Paste it below. You can add multiple keys using commas.</Text>
                    </View>
                  </View>
                  
                  <View style={styles.apiKeySection}>
                    <View style={styles.apiHeaderRow}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Groq API Key</Text>
                      {userGroqKey ? (
                        <View style={styles.activeKeyBadge}>
                          <CheckCircle2 size={10} color="#fff" />
                          <Text style={styles.activeKeyText}>PASTED</Text>
                        </View>
                      ) : (
                        <Text style={[styles.statusText, { color: colors.textMuted }]}>Using Default</Text>
                      )}
                    </View>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.glassBorder }]}
                      value={userGroqKey}
                      onChangeText={setUserGroqKey}
                      placeholder="gsk_..."
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                    />
                    <TouchableOpacity 
                      style={[styles.bigGetKeyBtn, { backgroundColor: Theme.colors.primary + '15' }]}
                      onPress={() => require('react-native').Linking.openURL('https://console.groq.com/keys')}
                    >
                      <Sparkles size={14} color={Theme.colors.primary} />
                      <Text style={[styles.bigGetKeyText, { color: Theme.colors.primary }]}>Get Groq API Key</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.apiKeySection}>
                    <View style={styles.apiHeaderRow}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Gemini API Key</Text>
                      {userGeminiKey ? (
                        <View style={styles.activeKeyBadge}>
                          <CheckCircle2 size={10} color="#fff" />
                          <Text style={styles.activeKeyText}>PASTED</Text>
                        </View>
                      ) : (
                        <Text style={[styles.statusText, { color: colors.textMuted }]}>Using Default</Text>
                      )}
                    </View>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.glassBorder }]}
                      value={userGeminiKey}
                      onChangeText={setUserGeminiKey}
                      placeholder="AIzaSy..."
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                    />
                    <TouchableOpacity 
                      style={[styles.bigGetKeyBtn, { backgroundColor: Theme.colors.primary + '15' }]}
                      onPress={() => require('react-native').Linking.openURL('https://aistudio.google.com/app/apikey')}
                    >
                      <Sparkles size={14} color={Theme.colors.primary} />
                      <Text style={[styles.bigGetKeyText, { color: Theme.colors.primary }]}>Get Gemini API Key</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.apiKeySection}>
                    <View style={styles.apiHeaderRow}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Pollinations Key (free fallback)</Text>
                      {userPollinationsKey ? (
                        <View style={styles.activeKeyBadge}>
                          <CheckCircle2 size={10} color="#fff" />
                          <Text style={styles.activeKeyText}>PASTED</Text>
                        </View>
                      ) : (
                        <Text style={[styles.statusText, { color: colors.textMuted }]}>Optional</Text>
                      )}
                    </View>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.glassBorder }]}
                      value={userPollinationsKey}
                      onChangeText={setUserPollinationsKey}
                      placeholder="pk_... (optional, no card needed)"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                    />
                    <TouchableOpacity 
                      style={[styles.bigGetKeyBtn, { backgroundColor: Theme.colors.primary + '15' }]}
                      onPress={() => require('react-native').Linking.openURL('https://enter.pollinations.ai')}
                    >
                      <Sparkles size={14} color={Theme.colors.primary} />
                      <Text style={[styles.bigGetKeyText, { color: Theme.colors.primary }]}>Get Free Pollinations Key</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.apiKeySection}>
                    <View style={styles.apiHeaderRow}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Meta Llama API Key</Text>
                      {userLlamaKey ? (
                        <View style={styles.activeKeyBadge}>
                          <CheckCircle2 size={10} color="#fff" />
                          <Text style={styles.activeKeyText}>PASTED</Text>
                        </View>
                      ) : (
                        <Text style={[styles.statusText, { color: colors.textMuted }]}>Optional</Text>
                      )}
                    </View>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.glassBorder }]}
                      value={userLlamaKey}
                      onChangeText={setUserLlamaKey}
                      placeholder="Paste Llama API key (preview)"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                    />
                    <TouchableOpacity 
                      style={[styles.bigGetKeyBtn, { backgroundColor: Theme.colors.primary + '15' }]}
                      onPress={() => require('react-native').Linking.openURL('https://llama.developer.meta.com/')}
                    >
                      <Sparkles size={14} color={Theme.colors.primary} />
                      <Text style={[styles.bigGetKeyText, { color: Theme.colors.primary }]}>Get Meta Llama Key</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={styles.saveBtn} 
                    onPress={async () => {
                      try {
                        // Save locally (supports empty/cleared values)
                        await UserStorage.saveGroqKey(userGroqKey);
                        await UserStorage.saveGeminiKey(userGeminiKey);
                        await UserStorage.savePollinationsKey(userPollinationsKey);
                        await UserStorage.saveLlamaKey(userLlamaKey);
                        
                        // Save to Firestore for cross-device sync
                        await updateUserProfile({
                          groqKey: userGroqKey,
                          geminiKey: userGeminiKey,
                          pollinationsKey: userPollinationsKey,
                          llamaKey: userLlamaKey,
                          preferredProvider: userPreferredProvider
                        });
                        
                        Alert.alert("Saved", "Your API keys have been updated and synced to your account.");
                        setActiveModal(null);
                      } catch (e) {
                        console.error(e);
                        Alert.alert("Error", "Failed to save keys.");
                      }
                    }}
                  >
                    <Text style={styles.saveBtnText}>Save Configuration</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.logoutBtn, { marginTop: 10 }]} 
                    onPress={async () => {
                      try {
                        await UserStorage.clearKeys();
                        await UserStorage.savePreferredProvider("auto");
                        setUserGroqKey("");
                        setUserGeminiKey("");
                        setUserPollinationsKey("");
                        setUserLlamaKey("");
                        setUserPreferredProvider("auto");
                        await updateUserProfile({
                          groqKey: "",
                          geminiKey: "",
                          pollinationsKey: "",
                          llamaKey: "",
                          preferredProvider: "auto"
                        });
                        Alert.alert("Cleared", "Personal API keys removed. App will now use default keys.");
                      } catch (e) {
                        console.error(e);
                        Alert.alert("Error", "Failed to reset keys.");
                      }
                    }}
                  >
                    <Text style={[styles.logoutText, { color: colors.textMuted }]}>Reset to Default Keys</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>


    </View>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <CheckCircle2 size={16} color="#fff" />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function Field({ label, value, onChange, colors, placeholder, icon: Icon }: any) {
  return (
    <View style={[styles.fieldContainerNew, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
      {Icon && (
        <View style={styles.fieldIconWrapperNew}>
          <Icon size={18} color={Theme.colors.primary} />
        </View>
      )}
      <View style={styles.fieldInputContentNew}>
        <Text style={[styles.fieldLabelNew, { color: colors.textMuted }]}>{label}</Text>
        <TextInput 
          style={[styles.inputNew, { color: colors.text }]} 
          value={value} 
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onChangeText={onChange} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  themeToggle: { 
    width: 64, 
    height: 32, 
    borderRadius: 20, 
    borderWidth: 1,
    padding: 2,
    justifyContent: "center" 
  },
  toggleTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: '100%',
    height: '100%',
  },
  toggleThumb: {
    position: 'absolute',
    left: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  profileCard: { flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 24, marginBottom: 20 },
  avatarContainer: { position: "relative" },
  avatar: { width: 70, height: 70, borderRadius: 35, justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  cameraBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: Theme.colors.secondary, width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  profileMeta: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: "row", marginTop: 8 },
  proBadge: { flexDirection: "row", alignItems: "center", backgroundColor: Theme.colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  proBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  statsGrid: { flexDirection: "row", gap: 15, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 4, textTransform: "uppercase" },

  referralCard: { borderRadius: 24, overflow: "hidden", marginBottom: 24 },
  referralGradient: { padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  referTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  referSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  referCodeBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  referCode: { color: "#fff", fontWeight: "800", fontSize: 14 },

  seamlessContainer: { marginBottom: 10 },
  simpleMenuItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 18, 
    paddingHorizontal: 10, 
    gap: 20 
  },
  simpleMenuLabel: { flex: 1, fontSize: 16, fontWeight: "600" },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },

  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 6,
  },
  groupedContainer: {
    borderRadius: 24,
    borderWidth: 1.2,
    overflow: "hidden",
  },
  groupedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  itemIconBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: { fontSize: 14, fontWeight: "600" },

  // Modal
  activeKeyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  activeKeyText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  statusText: { fontSize: 10, fontWeight: '500' },
  modalOverlay: { flex: 1 },
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },

  editForm: { gap: 15 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "700", marginLeft: 5 },
  input: { borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 15 },
  roleSection: { marginTop: 10 },
  roleHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: 18, borderRadius: 20, alignItems: "center", marginTop: 20 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  modalHint: { textAlign: "center", marginBottom: 10, fontSize: 14 },
  
  apiKeySection: { gap: 8, marginBottom: 15 },
  apiHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 5 },
  bigGetKeyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 12, 
    borderRadius: 14,
    marginTop: 4 
  },
  bigGetKeyText: { fontSize: 13, fontWeight: '800' },
  instructionsBox: { 
    backgroundColor: Theme.colors.primary + '05', 
    padding: 16, 
    borderRadius: 18, 
    marginVertical: 15,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '10'
  },
  instructionsTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  instructionStep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stepDot: { width: 6, height: 6, borderRadius: 3 },
  stepText: { fontSize: 12, fontWeight: '600', flex: 1 },

  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 20 },
  settingsLabel: { fontSize: 15, fontWeight: "600" },

   pricingContainer: { gap: 20 },
  premiumCard: { padding: 30, borderRadius: 32, overflow: 'hidden' },
  premiumHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  premiumTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  premiumPrice: { color: '#fff', fontSize: 42, fontWeight: '900', marginBottom: 25 },
  priceSub: { fontSize: 16, fontWeight: '600', opacity: 0.8 },
  benefitList: { gap: 12, marginBottom: 30 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  premiumBtn: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  premiumBtnText: { color: Theme.colors.primary, fontSize: 16, fontWeight: '800' },
  
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginVertical: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '800' },
  
  adCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, borderWidth: 1 },
  adInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  adIconBox: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  adTitleSmall: { fontSize: 16, fontWeight: '800' },
  adSubSmall: { fontSize: 12, marginTop: 2 },
  validityBadge: { backgroundColor: Theme.colors.success + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  validityText: { color: Theme.colors.success, fontSize: 10, fontWeight: '800' },
  pricingContent: { paddingHorizontal: 25, gap: 20 },

  // Edit Profile / Form Overhaul Styles
  modalSubHeader: { marginBottom: 20 },
  modalSubTitle: { fontSize: 22, fontWeight: '800' },
  modalDesc: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  inputGroupCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1.2, borderColor: 'rgba(0,0,0,0.08)' },
  addRoleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addRoleText: { fontSize: 12, fontWeight: '700' },
  roleRowCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1.2, marginBottom: 10, gap: 10 },
  roleInput: { flex: 1, fontSize: 15, fontWeight: '600', padding: 0 },
  deleteRoleBtn: { padding: 4 },

  // Redeem Code Overhaul Styles
  redeemCardContainer: { borderRadius: 24, padding: 25, borderWidth: 1.2, alignItems: 'center' },
  redeemInput: { width: '100%', borderRadius: 16, borderWidth: 1.2, padding: 18, fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: 2 },

  // Referral Overhaul Styles
  referralPromoCard: { borderRadius: 24, padding: 25, borderWidth: 1.2, alignItems: 'center' },
  referralPromoLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  referralCodeCopyRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 12, width: '100%' },
  referralCodeVal: { flex: 1, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  copyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  copyBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  referralStatsOverview: { flexDirection: 'row', gap: 15, marginVertical: 15 },
  refStatBox: { flex: 1, padding: 20, borderRadius: 20, borderWidth: 1.2, alignItems: 'center' },
  refStatVal: { fontSize: 26, fontWeight: '900' },
  refStatLabel: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '700' },
  emptyReferralContainer: { borderRadius: 24, padding: 40, borderWidth: 1.2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyReferralText: { fontSize: 13, textAlign: 'center', fontWeight: '500', lineHeight: 18 },
  referralListCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1.2 },
  referralItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  referralItemInfo: { gap: 4 },
  referralItemName: { fontSize: 15, fontWeight: '700' },
  referralItemDate: { fontSize: 12, fontWeight: '500' },
  referralStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  referralStatusText: { fontSize: 11, fontWeight: '800' },

  // Premium Subscription Overhaul Styles
  periodSelectorBg: { flexDirection: 'row', borderRadius: 20, padding: 6, borderWidth: 1.2 },
  periodBtn: { flex: 1, paddingVertical: 12, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  periodBtnActive: { shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  periodBtnText: { fontSize: 14, fontWeight: '800' },
  discountBadgeSmall: { backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  discountBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  premiumCardNew: { borderRadius: 32, padding: 30, borderWidth: 1.5, position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  cardHeaderBadge: { position: 'absolute', top: 20, right: -40, backgroundColor: '#f59e0b', paddingVertical: 6, paddingHorizontal: 40, transform: [{ rotate: '45deg' }], flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  cardHeaderBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  premiumTitleNew: { fontSize: 24, fontWeight: '900' },
  premiumSubTitleNew: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  priceContainerRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 20, marginBottom: 15 },
  premiumPriceNew: { fontSize: 44, fontWeight: '900' },
  priceSubNew: { fontSize: 16, fontWeight: '700', marginLeft: 4 },
  dividerLine: { height: 1.2, marginVertical: 20 },
  benefitListNew: { gap: 14, marginBottom: 25 },
  benefitRowNew: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircleBox: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  benefitTextNew: { fontSize: 14, fontWeight: '600', flex: 1 },
  premiumBtnNew: { width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  premiumBtnTextNew: { color: '#fff', fontSize: 15, fontWeight: '800' },
  adCardNew: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 24, borderWidth: 1.2 },
  validityBadgeNew: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  validityTextNew: { fontSize: 11, fontWeight: '800' },

  // Modal Avatar Styling Overhaul
  modalAvatarSection: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 8,
  },
  modalAvatarWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#fff',
  },
  modalAvatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  modalCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalAvatarHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Premium Details Input Styles
  fieldsGridNew: {
    gap: 12,
  },
  fieldContainerNew: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  fieldIconWrapperNew: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldInputContentNew: {
    flex: 1,
    gap: 2,
  },
  fieldLabelNew: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputNew: {
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
    marginTop: 2,
  },
  cardWidget: {
    borderRadius: 24,
    padding: 24,
    height: 180,
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardDisplayNum: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 10,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardFooterLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardFooterVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sandboxAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  sandboxAlertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  secureNote: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 15,
  },
});
