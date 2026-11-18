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
    Building2,
    Camera,
    ChevronRight,
    Compass,
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
    Phone,
    Play,
    Pause,
    RefreshCw,
    ExternalLink,
    Lock,
    AlertTriangle,
    Layers,
    Cpu,
    Key,
    Zap,
    Activity,
    MessageSquare,
    AlertCircle
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
import { getAIProviderStatus, testProviderKey, type ProviderLinkStatus } from "@/services/ai";
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

export const EASY_PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    speed: "⚡ 15 RPM Free",
    desc: "100% free via Google AI Studio with high RPM",
    url: "https://aistudio.google.com/app/apikey",
    badge: "1-Click Free",
    tagColor: "#10B981",
  },
  {
    id: "groq",
    name: "Groq Cloud",
    speed: "🚀 500+ T/s",
    desc: "Ultra-fast Llama 3.3 70B & Whisper audio",
    url: "https://console.groq.com/keys",
    badge: "Instant Key",
    tagColor: "#FDA758",
  },
  {
    id: "cerebras",
    name: "Cerebras AI",
    speed: "⚡ 1800+ T/s",
    desc: "Wafer-scale hardware inference, generous free tier",
    url: "https://cloud.cerebras.ai/",
    badge: "Fastest",
    tagColor: "#3B82F6",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    speed: "🌐 50+ Models",
    desc: "Single key for 40+ free models (:free models)",
    url: "https://openrouter.ai/keys",
    badge: "Universal",
    tagColor: "#8B5CF6",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    speed: "🇪🇺 Free Weights",
    desc: "Codestral & Mistral 7B via La Plateforme",
    url: "https://console.mistral.ai/api-keys/",
    badge: "Free Tier",
    tagColor: "#EC4899",
  },
  {
    id: "together",
    name: "Together AI",
    speed: "🎁 $5 Free",
    desc: "$5 free starter credit for open source models",
    url: "https://api.together.xyz/settings/api-keys",
    badge: "Credits",
    tagColor: "#14B8A6",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    speed: "🧠 V3 & R1",
    desc: "Official reasoning models at ultra-low price",
    url: "https://platform.deepseek.com/api_keys",
    badge: "Official",
    tagColor: "#06B6D4",
  },
];

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
  const [currentRole, setCurrentRole] = useState<"job_seeker" | "recruiter">("job_seeker");

  useEffect(() => {
    UserStorage.getUserRole().then((r) => {
      if (r) setCurrentRole(r);
    });
  }, []);

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
  const [userOpenRouterKey, setUserOpenRouterKey] = useState("");
  const [userCerebrasKey, setUserCerebrasKey] = useState("");
  const [userPollinationsKey, setUserPollinationsKey] = useState("");
  const [userLlamaKey, setUserLlamaKey] = useState("");
  const [userPreferredProvider, setUserPreferredProvider] = useState<PreferredProvider>("auto");
  const [aiChainStatus, setAiChainStatus] = useState<ProviderLinkStatus[] | null>(null);
  const [aiChainLoading, setAiChainLoading] = useState(false);
  const [aiConsoleStatus, setAiConsoleStatus] = useState<'active' | 'paused' | 'insufficient_quota'>("active");
  const [aiConsoleError, setAiConsoleError] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [apiConfigTab, setApiConfigTab] = useState<'console' | 'keys' | 'get_keys'>('console');

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
    if (activeModal === "API Configuration" || activeModal === "AI Configuration") {
      setAiChainLoading(true);
      getAIProviderStatus()
        .then(setAiChainStatus)
        .catch(() => setAiChainStatus(null))
        .finally(() => setAiChainLoading(false));

      // Load device-local keys and console status
      const loadDeviceKeys = async () => {
        try {
          const [groq, gemini, orKey, cerKey, polli, llama, pref, status, err] = await Promise.all([
            UserStorage.getGroqKey(),
            UserStorage.getGeminiKey(),
            UserStorage.getOpenRouterKey(),
            UserStorage.getCerebrasKey(),
            UserStorage.getPollinationsKey(),
            UserStorage.getLlamaKey(),
            UserStorage.getPreferredProvider(),
            UserStorage.getAiConsoleStatus(),
            UserStorage.getAiConsoleError(),
          ]);
          if (groq) setUserGroqKey(groq);
          if (gemini) setUserGeminiKey(gemini);
          if (orKey) setUserOpenRouterKey(orKey);
          if (cerKey) setUserCerebrasKey(cerKey);
          if (polli) setUserPollinationsKey(polli);
          if (llama) setUserLlamaKey(llama);
          setUserPreferredProvider(pref);
          setAiConsoleStatus(status);
          setAiConsoleError(err);
        } catch (e) {
          console.log("Error loading local AI keys:", e);
        }
      };
      loadDeviceKeys();
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
            // NOTE: API keys are strictly device-local and never fetched from database.
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
    
    // Fetch user keys directly from local device storage
    const fetchKeys = async () => {
      const [groq, gemini, orKey, cerKey, polli, llama, pref, status, err] = await Promise.all([
        UserStorage.getGroqKey(),
        UserStorage.getGeminiKey(),
        UserStorage.getOpenRouterKey(),
        UserStorage.getCerebrasKey(),
        UserStorage.getPollinationsKey(),
        UserStorage.getLlamaKey(),
        UserStorage.getPreferredProvider(),
        UserStorage.getAiConsoleStatus(),
        UserStorage.getAiConsoleError(),
      ]);
      if (groq) setUserGroqKey(groq);
      if (gemini) setUserGeminiKey(gemini);
      if (orKey) setUserOpenRouterKey(orKey);
      if (cerKey) setUserCerebrasKey(cerKey);
      if (polli) setUserPollinationsKey(polli);
      if (llama) setUserLlamaKey(llama);
      setUserPreferredProvider(pref);
      setAiConsoleStatus(status);
      setAiConsoleError(err);
    };
    fetchKeys();
  }, [user]);

  const handleToggleConsolePlay = async () => {
    if (aiConsoleStatus === 'active') {
      await UserStorage.saveAiConsoleStatus('paused');
      setAiConsoleStatus('paused');
      Alert.alert('AI Engine Paused', 'AI requests will be paused until you tap Push Play to resume.');
    } else {
      await UserStorage.saveAiConsoleStatus('active');
      await UserStorage.saveAiConsoleError('');
      setAiConsoleStatus('active');
      setAiConsoleError(null);
      Alert.alert('AI Engine Active', 'AI Engine is running and ready to process requests.');
    }
  };

  const handleTestKey = async (provider: string, keyInput: string) => {
    if (!keyInput.trim()) {
      Alert.alert('No Key Entered', `Please paste your ${provider} API key before testing.`);
      return;
    }
    setTestingProvider(provider);
    try {
      const result = await testProviderKey(provider, keyInput);
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: result.success, message: result.message },
      }));
      if (!result.quotaAvailable && UserStorage.parseMultiKeys(keyInput).length > 0) {
        setAiConsoleStatus('insufficient_quota');
        await UserStorage.saveAiConsoleStatus('insufficient_quota');
        await UserStorage.saveAiConsoleError(result.message);
      } else if (result.success) {
        setAiConsoleStatus('active');
        await UserStorage.saveAiConsoleStatus('active');
        await UserStorage.saveAiConsoleError('');
      }
    } catch (e: any) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: false, message: e?.message || 'Test failed' },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const getKeyCountText = (rawStr: string) => {
    const keys = UserStorage.parseMultiKeys(rawStr);
    if (keys.length === 0) return null;
    return `${keys.length} Key${keys.length > 1 ? 's' : ''} (Rotation Active)`;
  };

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
    { icon: Shield, label: "AI Configuration", sub: "Configure AI models & API keys" },
    { icon: Rocket, label: "Onboarding", sub: "Re-run setup wizard" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header matching reference */}
      <View style={styles.settingsHeader}>
        <TouchableOpacity
          style={styles.settingsMenuCircleBtn}
          onPress={() => {
            Alert.alert(
              "Quick Actions",
              "Choose an option:",
              [
                { text: "My Resumes", onPress: () => router.push("/my-resumes") },
                { text: "My Jobs", onPress: () => router.push("/my-jobs") },
                { text: "Redeem Code", onPress: () => setActiveModal("Redeem Code") },
                { text: "My Referrals", onPress: () => setActiveModal("My Referrals") },
                { text: "Re-run Onboarding", onPress: () => router.push("/onboarding") },
                { text: "Cancel", style: "cancel" },
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <View style={styles.menuBarTop} />
          <View style={styles.menuBarBottom} />
        </TouchableOpacity>

        <Text style={[styles.settingsHeaderTitle, { color: colors.text }]}>Settings</Text>

        <View style={{ width: 44, height: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Hero Card: Check Your Profile */}
        <View style={[styles.heroProfileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.heroProfileTextCol}>
            <Text style={[styles.heroProfileTitle, { color: colors.text }]}>Check Your Profile</Text>
            <Text style={[styles.heroProfileEmail, { color: colors.textMuted }]} numberOfLines={1}>
              {user?.email || name || "jonathansmith@gmail.com"}
            </Text>
            <TouchableOpacity
              style={[styles.heroViewBtn, { backgroundColor: Theme.colors.primary }]}
              onPress={() => setActiveModal("Edit Profile")}
              activeOpacity={0.85}
            >
              <Text style={styles.heroViewBtnText}>View</Text>
            </TouchableOpacity>
          </View>

          {/* Logged-in User Profile Photo with Royal Crown on Top */}
          <View style={styles.heroAvatarWrapper}>
            <View style={styles.heroCrownTop}>
              <Crown size={22} color="#FDA758" fill="#FDA758" strokeWidth={2} />
            </View>

            <TouchableOpacity
              style={styles.heroAvatarContainer}
              onPress={pickImage}
              activeOpacity={0.85}
            >
              {isUploading ? (
                <View style={[styles.heroAvatarImg, { backgroundColor: 'rgba(87, 51, 83, 0.1)', justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                </View>
              ) : (
                <Image
                  source={
                    profilePic
                      ? { uri: profilePic }
                      : (user?.photoURL ? { uri: user.photoURL } : require("@/assets/images/avatar-home.png"))
                  }
                  style={styles.heroAvatarImg}
                />
              )}
              <View style={styles.heroCameraBadge}>
                <Camera size={13} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 1: General */}
        <View style={styles.settingsSectionGroup}>
          <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>General</Text>

          {/* Notifications */}
          <TouchableOpacity
            style={[styles.settingsRowCard, { backgroundColor: colors.surface }]}
            onPress={() => setActiveModal("Settings")}
            activeOpacity={0.8}
          >
            <View style={styles.settingsIconCircle}>
              <Bell size={20} color={Theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.settingsRowTextCol}>
              <Text style={[styles.settingsRowTitle, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.settingsRowSubtitle, { color: colors.textMuted }]}>
                Customize notifications
              </Text>
            </View>
            <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* AI Configuration */}
          <TouchableOpacity
            style={[styles.settingsRowCard, { backgroundColor: colors.surface }]}
            onPress={() => setActiveModal("AI Configuration")}
            activeOpacity={0.8}
          >
            <View style={styles.settingsIconCircle}>
              <Cpu size={20} color={Theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.settingsRowTextCol}>
              <Text style={[styles.settingsRowTitle, { color: colors.text }]}>AI Configuration</Text>
              <Text style={[styles.settingsRowSubtitle, { color: colors.textMuted }]}>
                Configure AI models, API keys & failover engine
              </Text>
            </View>
            <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Elite Pro Access */}
          <TouchableOpacity
            style={[styles.settingsRowCard, { backgroundColor: colors.surface }]}
            onPress={() => setActiveModal("Subscription")}
            activeOpacity={0.8}
          >
            <View style={styles.settingsIconCircle}>
              <Crown size={20} color={Theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.settingsRowTextCol}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.settingsRowTitle, { color: colors.text }]}>Elite Pro Access</Text>
                {isPro && (
                  <View style={[styles.roleBadgePill, { backgroundColor: "#10B981" }]}>
                    <Text style={styles.roleBadgePillText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.settingsRowSubtitle, { color: colors.textMuted }]}>
                {isPro ? "Unlimited exports active" : "Upgrade to unlock unlimited PDF exports"}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Setup & Onboarding */}
          <TouchableOpacity
            style={[styles.settingsRowCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/onboarding")}
            activeOpacity={0.8}
          >
            <View style={styles.settingsIconCircle}>
              <Rocket size={20} color={Theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.settingsRowTextCol}>
              <Text style={[styles.settingsRowTitle, { color: colors.text }]}>Setup & Onboarding</Text>
              <Text style={[styles.settingsRowSubtitle, { color: colors.textMuted }]}>
                Update target roles, field & AI setup
              </Text>
            </View>
            <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Section 2: Support */}
        <View style={styles.settingsSectionGroup}>
          <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Support</Text>

          {/* Contact */}
          <TouchableOpacity
            style={[styles.settingsRowCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              Alert.alert(
                "Contact Support",
                "Need help or have questions? Get in touch with our team:\n\nEmail: support@resumeelite.app\nWebsite: resumeelite.app",
                [
                  {
                    text: "Copy Email",
                    onPress: () => {
                      Clipboard.setString("support@resumeelite.app");
                      Alert.alert("Copied", "Support email copied to clipboard.");
                    },
                  },
                  { text: "OK" },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <View style={styles.settingsIconCircle}>
              <Phone size={20} color={Theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.settingsRowTextCol}>
              <Text style={[styles.settingsRowTitle, { color: colors.text }]}>Contact</Text>
            </View>
            <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Feedback */}
          <TouchableOpacity
            style={[styles.settingsRowCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              Alert.alert(
                "Feedback",
                "Help us make Resume Elite better! Email your feedback directly to the developer at:\n\ndineshwebdev2003@gmail.com",
                [
                  {
                    text: "Copy Email",
                    onPress: () => {
                      Clipboard.setString("dineshwebdev2003@gmail.com");
                      Alert.alert("Copied", "Developer email copied to clipboard.");
                    },
                  },
                  { text: "OK" },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <View style={styles.settingsIconCircle}>
              <MessageSquare size={20} color={Theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.settingsRowTextCol}>
              <Text style={[styles.settingsRowTitle, { color: colors.text }]}>Feedback</Text>
            </View>
            <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={[styles.settingsRowCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              Alert.alert(
                "Privacy Policy",
                "Resume Elite Privacy Architecture:\n\n• Your AI API keys are stored 100% locally on your device.\n• We do not send your API keys to Firebase or any external database.\n• Resume data is saved privately to your personal account.\n• No third-party data tracking or ads."
              );
            }}
            activeOpacity={0.8}
          >
            <View style={styles.settingsIconCircle}>
              <Shield size={20} color={Theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.settingsRowTextCol}>
              <Text style={[styles.settingsRowTitle, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* About */}
          <TouchableOpacity
            style={[styles.settingsRowCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              Alert.alert(
                "About Resume Elite",
                "Resume Elite • Version 1.0.3\n\nNext-Generation AI Resume Builder & Career Suite\n\nFeatures:\n• Multi-provider failover AI engine\n• 1-tab free API keys\n• ATS formatting & score analysis\n• Dual Job Seeker & Recruiter modes\n\nCrafted with ❤️"
              );
            }}
            activeOpacity={0.8}
          >
            <View style={styles.settingsIconCircle}>
              <AlertCircle size={20} color={Theme.colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.settingsRowTextCol}>
              <Text style={[styles.settingsRowTitle, { color: colors.text }]}>About</Text>
            </View>
            <ChevronRight size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Card */}
        <TouchableOpacity
          style={[styles.settingsRowCard, styles.settingsLogoutCard, { backgroundColor: colors.surface }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <View style={[styles.settingsIconCircle, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
            <LogOut size={20} color="#EF4444" strokeWidth={2.2} />
          </View>
          <View style={styles.settingsRowTextCol}>
            <Text style={[styles.settingsRowTitle, { color: "#EF4444", fontWeight: "700" }]}>Sign Out</Text>
          </View>
          <ChevronRight size={18} color="#EF4444" strokeWidth={2.4} />
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
                        <Image source={require('@/assets/images/avatar-home.png')} style={styles.modalAvatar} />
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
                      <LinearGradient colors={isDark ? ['#573353', '#311042'] : ['#FFF6ED', '#FFE8D6']} style={[styles.premiumCardNew, { borderColor: Theme.colors.primary }]}>
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
                                // Retry without subscriptionOffers to isolate offer token issue
                                try {
                                  console.log("[IAP] Retry: basic subscription purchase without offers");
                                  await IAP.requestPurchase({
                                    request: {
                                      google: {
                                        skus: ['pro_plan'],
                                      },
                                    },
                                    type: 'subs',
                                  });
                                  console.log("[IAP] Basic purchase sheet launched, awaiting event...");
                                } catch (e2: any) {
                                  console.log("[IAP] Basic purchase also failed:", e2);
                                  Alert.alert("Purchase Failed", e.message || e2.message || "Failed to complete purchase.");
                                }
                              } finally {
                                setSimulatedPaying(false);
                              }
                            } else {
                              Alert.alert(
                                "Google Play Required",
                                "In-App Purchases are processed securely via Google Play Store. Please ensure Google Play Store is available on your device."
                              );
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

              {(activeModal === "API Configuration" || activeModal === "AI Configuration") && (
                <View style={[styles.editForm, { paddingHorizontal: 16 }]}>
                  {/* TOP 100% ON-DEVICE PRIVACY GUARANTEE BANNER */}
                  <View style={styles.apiTrustCard}>
                    <View style={styles.apiTrustHeader}>
                      <Shield size={18} color="#10B981" />
                      <Text style={styles.apiTrustTitle}>100% On-Device Privacy Guarantee</Text>
                    </View>
                    <Text style={styles.apiTrustBody}>
                      Your API keys are stored <Text style={{ fontWeight: '800' }}>ONLY locally on this device</Text> (AsyncStorage). We NEVER store, upload, or sync keys to our Firebase database or backend servers.
                    </Text>
                  </View>

                  {/* MODERN SEGMENTED NAVIGATION PILLS */}
                  <View style={[styles.apiTabBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(87, 51, 83, 0.06)' }]}>
                    <TouchableOpacity
                      style={[
                        styles.apiTabBtn,
                        apiConfigTab === 'console' && [styles.apiTabBtnActive, { backgroundColor: Theme.colors.primary }],
                      ]}
                      onPress={() => setApiConfigTab('console')}
                    >
                      <Cpu size={14} color={apiConfigTab === 'console' ? '#FFFFFF' : colors.textMuted} />
                      <Text style={[styles.apiTabBtnText, apiConfigTab === 'console' && styles.apiTabBtnTextActive]}>
                        Engine
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.apiTabBtn,
                        apiConfigTab === 'keys' && [styles.apiTabBtnActive, { backgroundColor: Theme.colors.primary }],
                      ]}
                      onPress={() => setApiConfigTab('keys')}
                    >
                      <Key size={14} color={apiConfigTab === 'keys' ? '#FFFFFF' : colors.textMuted} />
                      <Text style={[styles.apiTabBtnText, apiConfigTab === 'keys' && styles.apiTabBtnTextActive]}>
                        My Keys
                      </Text>
                      {(getKeyCountText(userGroqKey) || getKeyCountText(userGeminiKey)) && (
                        <View style={styles.tabBadgeDot} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.apiTabBtn,
                        apiConfigTab === 'get_keys' && [styles.apiTabBtnActive, { backgroundColor: Theme.colors.primary }],
                      ]}
                      onPress={() => setApiConfigTab('get_keys')}
                    >
                      <Zap size={14} color={apiConfigTab === 'get_keys' ? '#FFFFFF' : colors.textMuted} />
                      <Text style={[styles.apiTabBtnText, apiConfigTab === 'get_keys' && styles.apiTabBtnTextActive]}>
                        1-Tab Free
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* ═══════════ TAB 1: ENGINE CONSOLE ═══════════ */}
                  {apiConfigTab === 'console' && (
                    <View style={{ gap: 14 }}>
                      {/* Main Power Station Card */}
                      <LinearGradient
                        colors={
                          aiConsoleStatus === 'active'
                            ? isDark
                              ? ['#064e3b', '#022c22']
                              : ['#ecfdf5', '#d1fae5']
                            : aiConsoleStatus === 'paused'
                            ? isDark
                              ? ['#78350f', '#451a03']
                              : ['#fffbeb', '#fef3c7']
                            : isDark
                            ? ['#7f1d1d', '#450a0a']
                            : ['#fef2f2', '#fee2e2']
                        }
                        style={[
                          styles.heroEngineCard,
                          {
                            borderColor:
                              aiConsoleStatus === 'active'
                                ? '#10B981'
                                : aiConsoleStatus === 'paused'
                                ? '#F59E0B'
                                : '#EF4444',
                          },
                        ]}
                      >
                        {/* Live Status Badge */}
                        <View style={styles.engineStatusHeader}>
                          <View
                            style={[
                              styles.engineStatusPill,
                              {
                                backgroundColor:
                                  aiConsoleStatus === 'active'
                                    ? '#10B98125'
                                    : aiConsoleStatus === 'paused'
                                    ? '#F59E0B25'
                                    : '#EF444425',
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.engineStatusPulseDot,
                                {
                                  backgroundColor:
                                    aiConsoleStatus === 'active'
                                      ? '#10B981'
                                      : aiConsoleStatus === 'paused'
                                      ? '#F59E0B'
                                      : '#EF4444',
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.engineStatusPillText,
                                {
                                  color:
                                    aiConsoleStatus === 'active'
                                      ? '#059669'
                                      : aiConsoleStatus === 'paused'
                                      ? '#D97706'
                                      : '#DC2626',
                                },
                              ]}
                            >
                              {aiConsoleStatus === 'active'
                                ? 'ENGINE ONLINE & RUNNING'
                                : aiConsoleStatus === 'paused'
                                ? 'ENGINE PAUSED (IDLE)'
                                : 'INSUFFICIENT QUOTA (AUTO-STOPPED)'}
                            </Text>
                          </View>

                          <View style={styles.engineMetaBadge}>
                            <Activity size={12} color={colors.textMuted} />
                            <Text style={[styles.engineMetaText, { color: colors.textMuted }]}>
                              Smart Failover
                            </Text>
                          </View>
                        </View>

                        {/* Push Play / Pause Power Action */}
                        <View style={styles.enginePowerCenter}>
                          <TouchableOpacity
                            style={[
                              styles.enginePowerBtn,
                              {
                                backgroundColor:
                                  aiConsoleStatus === 'active' ? '#F59E0B' : '#10B981',
                              },
                            ]}
                            onPress={handleToggleConsolePlay}
                            activeOpacity={0.85}
                          >
                            {aiConsoleStatus === 'active' ? (
                              <Pause size={28} color="#FFFFFF" />
                            ) : (
                              <Play size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                            )}
                          </TouchableOpacity>
                          <Text style={[styles.enginePowerTitle, { color: colors.text }]}>
                            {aiConsoleStatus === 'active'
                              ? 'Tap to Pause AI Processing'
                              : 'Push Play to Resume Engine'}
                          </Text>
                          <Text style={[styles.enginePowerSub, { color: colors.textMuted }]}>
                            {aiConsoleStatus === 'active'
                              ? 'Requests process directly through your active keys'
                              : 'AI generation is currently halted'}
                          </Text>
                        </View>

                        {/* Insufficient Quota Alert */}
                        {aiConsoleStatus === 'insufficient_quota' && (
                          <View style={styles.engineAlertBox}>
                            <AlertTriangle size={16} color="#DC2626" />
                            <Text style={styles.engineAlertText}>
                              {aiConsoleError || 'All active keys exceeded free quota. Engine auto-stopped to prevent errors.'} Switch to "1-Tab Free" to copy a fresh key!
                            </Text>
                          </View>
                        )}

                        {/* Quick Ping Test Action */}
                        <View style={styles.engineFooterRow}>
                          <TouchableOpacity
                            style={[styles.enginePingBtn, { backgroundColor: Theme.colors.primary }]}
                            onPress={() => {
                              const targetProv = userPreferredProvider === 'auto' ? 'groq' : userPreferredProvider;
                              const targetKey = targetProv === 'gemini' ? userGeminiKey : userGroqKey;
                              handleTestKey(targetProv, targetKey);
                            }}
                            disabled={testingProvider !== null}
                          >
                            {testingProvider ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <RefreshCw size={13} color="#FFFFFF" />
                            )}
                            <Text style={styles.enginePingBtnText}>
                              {testingProvider ? 'Testing...' : 'Ping Test Active Key'}
                            </Text>
                          </TouchableOpacity>

                          {testResults[userPreferredProvider === 'auto' ? 'groq' : userPreferredProvider] && (
                            <Text
                              style={[
                                styles.enginePingResultText,
                                {
                                  color: testResults[userPreferredProvider === 'auto' ? 'groq' : userPreferredProvider]?.success
                                    ? '#059669'
                                    : '#DC2626',
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {testResults[userPreferredProvider === 'auto' ? 'groq' : userPreferredProvider]?.message}
                            </Text>
                          )}
                        </View>
                      </LinearGradient>

                      {/* Active Model Selection */}
                      <View style={[styles.instructionsBox, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text style={[styles.instructionsTitle, { color: colors.text, marginBottom: 0 }]}>
                            Select Primary AI Model
                          </Text>
                          <Sparkles size={14} color={Theme.colors.primary} />
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {(
                            [
                              { id: "auto", label: "Auto (Recommended)" },
                              { id: "groq", label: "Groq Llama 3.3 70B" },
                              { id: "gemini", label: "Google Gemini 2.0" },
                              { id: "cerebras", label: "Cerebras AI" },
                              { id: "openrouter", label: "OpenRouter" },
                              { id: "pollinations", label: "Pollinations Free" },
                              { id: "meta-llama", label: "Meta Llama" },
                            ] as { id: PreferredProvider; label: string }[]
                          ).map((opt) => {
                            const selected = userPreferredProvider === opt.id;
                            return (
                              <TouchableOpacity
                                key={opt.id}
                                style={[
                                  styles.modelChip,
                                  {
                                    backgroundColor: selected ? Theme.colors.primary : 'transparent',
                                    borderColor: selected ? Theme.colors.primary : colors.glassBorder,
                                  },
                                ]}
                                onPress={async () => {
                                  setUserPreferredProvider(opt.id);
                                  await UserStorage.savePreferredProvider(opt.id);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.modelChipText,
                                    { color: selected ? '#FFFFFF' : colors.text },
                                  ]}
                                >
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <Text style={[styles.stepText, { color: colors.textMuted, marginTop: 8 }]}>
                          Auto mode intelligently balances high speed with fallback reliability.
                        </Text>
                      </View>

                      {/* Live Fallback Chain Status */}
                      <View style={[styles.instructionsBox, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <Text style={[styles.instructionsTitle, { color: colors.text, marginBottom: 8 }]}>
                          Active Failover Chain {aiChainLoading ? '(checking…)' : ''}
                        </Text>
                        {(aiChainStatus || []).map((link, i) => {
                          const dot =
                            link.state === 'active'
                              ? '#10b981'
                              : link.state === 'ready'
                              ? Theme.colors.primary
                              : link.state === 'error'
                              ? '#ef4444'
                              : colors.textMuted;
                          return (
                            <View key={link.id} style={styles.instructionStep}>
                              <View style={[styles.stepDot, { backgroundColor: dot }]} />
                              <Text style={[styles.stepText, { color: colors.textMuted }]}>
                                {i + 1}. {link.label} — {link.detail}
                                {userPreferredProvider !== 'auto' && link.id === userPreferredProvider ? ' ★' : ''}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* ═══════════ TAB 2: MANAGE KEYS & ROTATION ═══════════ */}
                  {apiConfigTab === 'keys' && (
                    <View style={{ gap: 16 }}>
                      {/* Groq Card */}
                      <View style={[styles.apiKeyCardPro, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <View style={styles.apiKeyCardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.provIconWrap, { backgroundColor: '#FDA75820' }]}>
                              <Zap size={16} color="#FDA758" />
                            </View>
                            <View>
                              <Text style={[styles.apiKeyCardTitle, { color: colors.text }]}>Groq Cloud API Keys</Text>
                              <Text style={[styles.apiKeyCardSub, { color: colors.textMuted }]}>Llama 3.3 70B • 500+ tok/s</Text>
                            </View>
                          </View>
                          {getKeyCountText(userGroqKey) ? (
                            <View style={styles.apiMultiKeyBadge}>
                              <CheckCircle2 size={11} color="#059669" />
                              <Text style={styles.apiMultiKeyBadgeText}>{getKeyCountText(userGroqKey)}</Text>
                            </View>
                          ) : (
                            <Text style={[styles.statusText, { color: colors.textMuted }]}>Using Default</Text>
                          )}
                        </View>

                        <TextInput
                          style={[
                            styles.proKeyInput,
                            { backgroundColor: colors.background, color: colors.text, borderColor: colors.glassBorder },
                          ]}
                          value={userGroqKey}
                          onChangeText={setUserGroqKey}
                          placeholder="Paste single or multiple keys (comma or newline separated)"
                          placeholderTextColor={colors.textMuted}
                          multiline={true}
                        />

                        <View style={styles.keyCardActionsRow}>
                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: 'rgba(87, 51, 83, 0.08)' }]}
                            onPress={async () => {
                              try {
                                const text = await Clipboard.getString();
                                if (text) {
                                  setUserGroqKey(prev => (prev ? `${prev}, ${text}` : text));
                                }
                              } catch {}
                            }}
                          >
                            <Text style={[styles.keyActionBtnText, { color: colors.text }]}>📋 Paste</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: '#10B98118' }]}
                            onPress={() => handleTestKey('groq', userGroqKey)}
                          >
                            <RefreshCw size={12} color="#059669" />
                            <Text style={[styles.keyActionBtnText, { color: '#059669' }]}>Test Key</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: Theme.colors.primary + '18' }]}
                            onPress={() => require('react-native').Linking.openURL('https://console.groq.com/keys')}
                          >
                            <ExternalLink size={12} color={Theme.colors.primary} />
                            <Text style={[styles.keyActionBtnText, { color: Theme.colors.primary }]}>Get Key (1 Tab)</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Gemini Card */}
                      <View style={[styles.apiKeyCardPro, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <View style={styles.apiKeyCardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.provIconWrap, { backgroundColor: '#10B98120' }]}>
                              <Sparkles size={16} color="#10B981" />
                            </View>
                            <View>
                              <Text style={[styles.apiKeyCardTitle, { color: colors.text }]}>Google Gemini API Keys</Text>
                              <Text style={[styles.apiKeyCardSub, { color: colors.textMuted }]}>Gemini 2.0 Flash • 15 RPM Free</Text>
                            </View>
                          </View>
                          {getKeyCountText(userGeminiKey) ? (
                            <View style={styles.apiMultiKeyBadge}>
                              <CheckCircle2 size={11} color="#059669" />
                              <Text style={styles.apiMultiKeyBadgeText}>{getKeyCountText(userGeminiKey)}</Text>
                            </View>
                          ) : (
                            <Text style={[styles.statusText, { color: colors.textMuted }]}>Using Default</Text>
                          )}
                        </View>

                        <TextInput
                          style={[
                            styles.proKeyInput,
                            { backgroundColor: colors.background, color: colors.text, borderColor: colors.glassBorder },
                          ]}
                          value={userGeminiKey}
                          onChangeText={setUserGeminiKey}
                          placeholder="AIzaSy... (supports multi-keys with commas)"
                          placeholderTextColor={colors.textMuted}
                          multiline={true}
                        />

                        <View style={styles.keyCardActionsRow}>
                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: 'rgba(87, 51, 83, 0.08)' }]}
                            onPress={async () => {
                              try {
                                const text = await Clipboard.getString();
                                if (text) {
                                  setUserGeminiKey(prev => (prev ? `${prev}, ${text}` : text));
                                }
                              } catch {}
                            }}
                          >
                            <Text style={[styles.keyActionBtnText, { color: colors.text }]}>📋 Paste</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: '#10B98118' }]}
                            onPress={() => handleTestKey('gemini', userGeminiKey)}
                          >
                            <RefreshCw size={12} color="#059669" />
                            <Text style={[styles.keyActionBtnText, { color: '#059669' }]}>Test Key</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: Theme.colors.primary + '18' }]}
                            onPress={() => require('react-native').Linking.openURL('https://aistudio.google.com/app/apikey')}
                          >
                            <ExternalLink size={12} color={Theme.colors.primary} />
                            <Text style={[styles.keyActionBtnText, { color: Theme.colors.primary }]}>Get Key (1 Tab)</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* OpenRouter Card */}
                      <View style={[styles.apiKeyCardPro, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <View style={styles.apiKeyCardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.provIconWrap, { backgroundColor: '#8B5CF620' }]}>
                              <Layers size={16} color="#8B5CF6" />
                            </View>
                            <View>
                              <Text style={[styles.apiKeyCardTitle, { color: colors.text }]}>OpenRouter Key</Text>
                              <Text style={[styles.apiKeyCardSub, { color: colors.textMuted }]}>Access 40+ free models (:free)</Text>
                            </View>
                          </View>
                          {getKeyCountText(userOpenRouterKey) ? (
                            <View style={styles.apiMultiKeyBadge}>
                              <CheckCircle2 size={11} color="#059669" />
                              <Text style={styles.apiMultiKeyBadgeText}>PASTED</Text>
                            </View>
                          ) : (
                            <Text style={[styles.statusText, { color: colors.textMuted }]}>Optional</Text>
                          )}
                        </View>

                        <TextInput
                          style={[
                            styles.proKeyInput,
                            { backgroundColor: colors.background, color: colors.text, borderColor: colors.glassBorder },
                          ]}
                          value={userOpenRouterKey}
                          onChangeText={setUserOpenRouterKey}
                          placeholder="sk-or-v1-..."
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry
                        />

                        <View style={styles.keyCardActionsRow}>
                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: '#10B98118' }]}
                            onPress={() => handleTestKey('openrouter', userOpenRouterKey)}
                          >
                            <RefreshCw size={12} color="#059669" />
                            <Text style={[styles.keyActionBtnText, { color: '#059669' }]}>Test Key</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: Theme.colors.primary + '18' }]}
                            onPress={() => require('react-native').Linking.openURL('https://openrouter.ai/keys')}
                          >
                            <ExternalLink size={12} color={Theme.colors.primary} />
                            <Text style={[styles.keyActionBtnText, { color: Theme.colors.primary }]}>Get Key (1 Tab)</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Cerebras Card */}
                      <View style={[styles.apiKeyCardPro, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                        <View style={styles.apiKeyCardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={[styles.provIconWrap, { backgroundColor: '#3B82F620' }]}>
                              <Cpu size={16} color="#3B82F6" />
                            </View>
                            <View>
                              <Text style={[styles.apiKeyCardTitle, { color: colors.text }]}>Cerebras AI Key</Text>
                              <Text style={[styles.apiKeyCardSub, { color: colors.textMuted }]}>Wafer Scale • 1800+ tok/s</Text>
                            </View>
                          </View>
                          {getKeyCountText(userCerebrasKey) ? (
                            <View style={styles.apiMultiKeyBadge}>
                              <CheckCircle2 size={11} color="#059669" />
                              <Text style={styles.apiMultiKeyBadgeText}>PASTED</Text>
                            </View>
                          ) : (
                            <Text style={[styles.statusText, { color: colors.textMuted }]}>Optional</Text>
                          )}
                        </View>

                        <TextInput
                          style={[
                            styles.proKeyInput,
                            { backgroundColor: colors.background, color: colors.text, borderColor: colors.glassBorder },
                          ]}
                          value={userCerebrasKey}
                          onChangeText={setUserCerebrasKey}
                          placeholder="csk-..."
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry
                        />

                        <View style={styles.keyCardActionsRow}>
                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: '#10B98118' }]}
                            onPress={() => handleTestKey('cerebras', userCerebrasKey)}
                          >
                            <RefreshCw size={12} color="#059669" />
                            <Text style={[styles.keyActionBtnText, { color: '#059669' }]}>Test Key</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.keyActionBtn, { backgroundColor: Theme.colors.primary + '18' }]}
                            onPress={() => require('react-native').Linking.openURL('https://cloud.cerebras.ai/')}
                          >
                            <ExternalLink size={12} color={Theme.colors.primary} />
                            <Text style={[styles.keyActionBtnText, { color: Theme.colors.primary }]}>Get Key (1 Tab)</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Save Button (100% On-Device Only) */}
                      <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: Theme.colors.primary, marginTop: 10 }]}
                        onPress={async () => {
                          try {
                            await UserStorage.saveGroqKey(userGroqKey);
                            await UserStorage.saveGeminiKey(userGeminiKey);
                            await UserStorage.saveOpenRouterKey(userOpenRouterKey);
                            await UserStorage.saveCerebrasKey(userCerebrasKey);
                            await UserStorage.savePollinationsKey(userPollinationsKey);
                            await UserStorage.saveLlamaKey(userLlamaKey);
                            await UserStorage.savePreferredProvider(userPreferredProvider);

                            Alert.alert("Saved Locally 🔒", "Your API keys are saved strictly on this device (AsyncStorage). We never send keys to our database.");
                            setActiveModal(null);
                          } catch (e) {
                            Alert.alert("Error", "Failed to save configuration.");
                          }
                        }}
                      >
                        <Text style={styles.saveBtnText}>Save Keys (On-Device Only)</Text>
                      </TouchableOpacity>

                      {/* Reset Button */}
                      <TouchableOpacity
                        style={[styles.logoutBtn, { marginTop: 4 }]}
                        onPress={async () => {
                          try {
                            await UserStorage.clearKeys();
                            await UserStorage.savePreferredProvider("auto");
                            setUserGroqKey("");
                            setUserGeminiKey("");
                            setUserOpenRouterKey("");
                            setUserCerebrasKey("");
                            setUserPollinationsKey("");
                            setUserLlamaKey("");
                            setUserPreferredProvider("auto");
                            setAiConsoleStatus("active");
                            setAiConsoleError(null);
                            Alert.alert("Reset Complete", "All local keys cleared. App will now use default shared keys.");
                          } catch (e) {
                            Alert.alert("Error", "Failed to reset keys.");
                          }
                        }}
                      >
                        <Text style={[styles.logoutText, { color: colors.textMuted }]}>Reset to Default Shared Keys</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* ═══════════ TAB 3: 1-TAB FREE KEYS HUB ═══════════ */}
                  {apiConfigTab === 'get_keys' && (
                    <View style={{ gap: 14 }}>
                      <Text style={[styles.stepText, { color: colors.textMuted, fontSize: 13, marginBottom: 4 }]}>
                        Tap any provider below to open their developer portal in 1 click, copy a free key, and paste it into the "My Keys" tab:
                      </Text>

                      {EASY_PROVIDERS.map((prov) => (
                        <View
                          key={prov.id}
                          style={[
                            styles.freeHubCard,
                            { backgroundColor: colors.surface, borderColor: colors.glassBorder },
                          ]}
                        >
                          <View style={styles.freeHubCardHeader}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text style={[styles.freeHubTitle, { color: colors.text }]}>{prov.name}</Text>
                                <View style={[styles.provBadgePill, { backgroundColor: prov.tagColor + '20' }]}>
                                  <Text style={[styles.provBadgePillText, { color: prov.tagColor }]}>{prov.badge}</Text>
                                </View>
                              </View>
                              <Text style={[styles.freeHubSpeed, { color: prov.tagColor }]}>{prov.speed}</Text>
                              <Text style={[styles.freeHubDesc, { color: colors.textMuted }]}>{prov.desc}</Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={[styles.freeHubLaunchBtn, { backgroundColor: prov.tagColor }]}
                            onPress={() => require('react-native').Linking.openURL(prov.url)}
                            activeOpacity={0.85}
                          >
                            <ExternalLink size={14} color="#FFFFFF" />
                            <Text style={styles.freeHubLaunchBtnText}>Get Free Key (1 Tab)</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
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

  /* Reference Screen Design Styles */
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  settingsMenuCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(87, 51, 83, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuBarTop: {
    width: 18,
    height: 2.5,
    backgroundColor: "#573353",
    borderRadius: 2,
    marginBottom: 4,
  },
  menuBarBottom: {
    width: 14,
    height: 2.5,
    backgroundColor: "#573353",
    borderRadius: 2,
  },
  settingsHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heroProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 22,
    marginTop: 10,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  heroProfileTextCol: {
    flex: 1,
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 6,
  },
  heroProfileTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  heroProfileEmail: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  heroViewBtn: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  heroViewBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  heroAvatarWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    paddingTop: 14,
  },
  heroCrownTop: {
    position: "absolute",
    top: 0,
    zIndex: 10,
    shadowColor: "#FDA758",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  heroAvatarContainer: {
    position: "relative",
    padding: 3,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: "rgba(253, 167, 88, 0.45)",
    backgroundColor: "#FFFFFF",
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroAvatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  heroCameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Theme.colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  settingsSectionGroup: {
    marginBottom: 10,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 4,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  settingsRowCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 10,
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  settingsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(253, 167, 88, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingsRowTextCol: {
    flex: 1,
  },
  settingsRowTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  settingsRowSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgePillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  settingsLogoutCard: {
    marginTop: 6,
  },
  
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

  chooseRoleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 14,
    shadowColor: "#573353",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chooseRoleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  chooseRoleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chooseRoleTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  roleStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleStatusBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  chooseRoleSub: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

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
  // API Console & Privacy Styles
  apiTrustCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 16,
    marginBottom: 16,
  },
  apiTrustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  apiTrustTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  apiTrustBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#047857',
    fontWeight: '500',
  },
  apiTrustBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  apiTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  apiTrustBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  apiConsoleCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 16,
    marginBottom: 16,
  },
  apiConsoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  apiConsoleTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  apiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  apiStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  apiStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  apiPlayPauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 5,
  },
  apiPlayPauseText: {
    fontSize: 11,
    fontWeight: '800',
  },
  apiErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  apiErrorBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
    lineHeight: 16,
  },
  apiConsoleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  apiTestKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  apiTestKeyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  apiTestResultText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  apiQuickCard: {
    width: 155,
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 12,
    justifyContent: 'space-between',
  },
  apiQuickName: {
    fontSize: 13,
    fontWeight: '800',
  },
  apiQuickBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  apiQuickSpeed: {
    fontSize: 10,
    fontWeight: '700',
    marginVertical: 4,
  },
  apiQuickDesc: {
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 8,
  },
  apiQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  apiQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  apiMultiKeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  apiMultiKeyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  apiKeyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  // Redesigned Segmented Tabs & Studio Engine Styles
  apiTabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  apiTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 5,
    position: 'relative',
  },
  apiTabBtnActive: {
    shadowColor: '#573353',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  apiTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  apiTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    position: 'absolute',
    top: 6,
    right: 8,
  },
  heroEngineCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  engineStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  engineStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  engineStatusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  engineStatusPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  engineMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engineMetaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  enginePowerCenter: {
    alignItems: 'center',
    marginVertical: 12,
  },
  enginePowerBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  enginePowerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  enginePowerSub: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  engineAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  engineAlertText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
    lineHeight: 16,
  },
  engineFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 10,
  },
  enginePingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  enginePingBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  enginePingResultText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  modelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.2,
  },
  modelChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  apiKeyCardPro: {
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 16,
  },
  apiKeyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  provIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiKeyCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  apiKeyCardSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  proKeyInput: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    minHeight: 52,
    marginBottom: 10,
  },
  keyCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  keyActionBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  freeHubCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 16,
    gap: 12,
  },
  freeHubCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  freeHubTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  provBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  provBadgePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  freeHubSpeed: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  freeHubDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  freeHubLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  freeHubLaunchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
