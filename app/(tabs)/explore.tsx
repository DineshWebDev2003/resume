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
    CreditCard,
    Sun,
    CheckCircle2,
    Sparkles
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
} from "react-native";
import { RewardedAd, RewardedAdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { API_CONFIG } from "@/constants/config";
import { exportToPDF } from "@/utils/resume-exporter";
import { uploadToCloudinary } from "@/services/cloudinary";
import { updateUserProfile, applyReferralCode } from "@/services/firestore";
import { updateUserPhoto, signOut } from "@/services/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const adUnitId = __DEV__ ? TestIds.REWARDED : API_CONFIG.ADMOB_IDS.REWARDED_AD_UNIT_ID;
const bannerId = __DEV__ ? TestIds.BANNER : API_CONFIG.ADMOB_IDS.BANNER_AD_UNIT_ID;

// Create rewarded instance safely
let rewarded: any = null;
try {
  rewarded = RewardedAd.createForAdRequest(adUnitId, {
    keywords: ['resume', 'job', 'career'],
  });
} catch (e) {
  console.log('AdMob Rewarded not available');
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { toggleTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [notifications, setNotifications] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [resumeLimit, setResumeLimit] = useState(3);
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
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // AdMob States
  const [adsWatched, setAdsWatched] = useState(0);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    if (!rewarded) return;
    
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsAdLoaded(true);
    });
    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setAdsWatched(prev => {
          const next = prev + 1;
          if (next >= 3) {
            handleGrantFreeExports();
            return 0;
          }
          Alert.alert("Reward Earned!", `You've watched ${next}/3 ads. Watch ${3 - next} more for 3 free exports!`);
          return next;
        });
      },
    );

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, [rewarded]);

  const handleGrantFreeExports = async () => {
    try {
      const newLimit = resumeLimit + 3;
      await updateUserProfile({ resumeLimit: newLimit });
      setResumeLimit(newLimit);
      Alert.alert("Success!", "You've earned 3 free resume exports! Valid for 24 hours.");
    } catch (e) {
      Alert.alert("Error", "Could not update your limit. Please try again.");
    }
  };

  const showAd = () => {
    if (!rewarded) {
      Alert.alert("Expo Go", "Ads are only available in the native build. Rebuild with npx expo run:android to test ads.");
      return;
    }
    if (isAdLoaded) {
      rewarded.show();
      setIsAdLoaded(false);
      rewarded.load();
    } else {
      Alert.alert("Ad Loading", "The ad is still loading, please try again in a moment.");
      rewarded.load();
    }
  };

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
            if (data.github) setGithub(data.github);
            if (data.linkedin) setLinkedin(data.linkedin);
            if (data.website) setWebsite(data.website);
            if (data.referralCode) setReferralCode(data.referralCode);
            if (data.resumeLimit) setResumeLimit(data.resumeLimit);
            if (data.referralCount) setReferralCount(data.referralCount);
          }
        } catch (error) {
          console.log("Firestore Fetch error:", error);
        }
      }
    };
    fetchProfile();
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
    { icon: Users, label: "My Referrals", sub: "See who you invited" },
    { icon: CreditCard, label: "Subscription", sub: "Plan & Billing" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Elite Profile</Text>
          <TouchableOpacity 
            onPress={toggleTheme} 
            activeOpacity={0.8}
            style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
          >
            <View style={styles.toggleTrack}>
              <View style={[styles.toggleThumb, { 
                backgroundColor: isDark ? Theme.colors.primary : '#fff',
                transform: [{ translateX: isDark ? 32 : 0 }]
              }]} />
              <Sun size={12} color={!isDark ? Theme.colors.primary : colors.textMuted} fill={!isDark ? Theme.colors.primary : 'transparent'} />
              <Moon size={12} color={isDark ? '#fff' : colors.textMuted} fill={isDark ? '#fff' : 'transparent'} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
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
              <View style={styles.proBadge}>
                <Crown size={10} color="#fff" />
                <Text style={styles.proBadgeText}>PRO ELITE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNum, { color: Theme.colors.primary }]}>{resumeLimit}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Exports Left</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNum, { color: Theme.colors.secondary }]}>{referralCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Referrals</Text>
          </View>
        </View>

        {/* Referral Card */}
        <TouchableOpacity style={styles.referralCard} onPress={() => {
          Share.share({ message: `Build elite resumes! Use my code: ${referralCode}` });
        }}>
          <LinearGradient colors={['#D81B60', '#FF4081']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.referralGradient}>
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

        {/* Professional Links & About */}
        {(portfolio || github || linkedin || website) ? (
          <View style={[styles.menuWrapper, { backgroundColor: colors.surface, marginBottom: 20 }]}>
            <Text style={[styles.sectionTitleSmall, { color: colors.text }]}>Professional Links</Text>
            {portfolio ? (
              <View style={styles.linkRow}>
                <Globe size={18} color={Theme.colors.primary} />
                <Text style={[styles.linkText, { color: colors.text }]} numberOfLines={1}>{portfolio.replace('https://','')}</Text>
              </View>
            ) : null}
            {github ? (
              <View style={styles.linkRow}>
                <FileText size={18} color={Theme.colors.primary} />
                <Text style={[styles.linkText, { color: colors.text }]} numberOfLines={1}>{github.replace('https://github.com/','')}</Text>
              </View>
            ) : null}
            {linkedin ? (
              <View style={styles.linkRow}>
                <Users size={18} color={Theme.colors.primary} />
                <Text style={[styles.linkText, { color: colors.text }]} numberOfLines={1}>{linkedin.replace('https://linkedin.com/in/','')}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Menu Section */}
        <View style={[styles.menuWrapper, { backgroundColor: colors.surface }]}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.menuItem, idx !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.glassBorder }]}
              onPress={() => setActiveModal(item.label)}
            >
              <View style={[styles.menuIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                <item.icon size={20} color={Theme.colors.primary} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.menuSub, { color: colors.textMuted }]}>{item.sub}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

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
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{activeModal}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeModal === "Edit Profile" && (
                <View style={styles.editForm}>
                  <Field label="Full Name" value={name} onChange={setName} colors={colors} />
                  <Field label="Location" value={location} onChange={setLocation} colors={colors} />
                  <Field label="Education" value={education} onChange={setEducation} colors={colors} />
                  
                  <View style={styles.roleSection}>
                    <Text style={[styles.fieldLabel, { color: colors.textMuted, marginBottom: 8 }]}>Professional Links</Text>
                    <Field label="Portfolio URL" value={portfolio} onChange={setPortfolio} colors={colors} placeholder="https://..." />
                    <Field label="GitHub URL" value={github} onChange={setGithub} colors={colors} placeholder="https://github.com/..." />
                    <Field label="LinkedIn URL" value={linkedin} onChange={setLinkedin} colors={colors} placeholder="https://linkedin.com/in/..." />
                    <Field label="Other Website" value={website} onChange={setWebsite} colors={colors} placeholder="https://..." />
                  </View>

                  <View style={styles.roleSection}>
                    <View style={styles.roleHeader}>
                      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Job Roles</Text>
                      <TouchableOpacity onPress={() => setJobRoles([...jobRoles, ""])}>
                        <Plus size={18} color={Theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                    {jobRoles.map((role, i) => (
                      <View key={i} style={styles.roleRow}>
                        <TextInput 
                          style={[styles.input, { flex: 1, backgroundColor: colors.surface, color: colors.text, borderColor: colors.glassBorder }]} 
                          value={role} 
                          onChangeText={(t) => {
                            const n = [...jobRoles];
                            n[i] = t;
                            setJobRoles(n);
                          }}
                        />
                        <TouchableOpacity onPress={() => setJobRoles(jobRoles.filter((_, idx) => idx !== i))}>
                          <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={styles.saveBtn} 
                    onPress={async () => {
                      await updateUserProfile({ name, location, education, jobRoles, portfolio, github, linkedin, website });
                      Alert.alert("Success", "Profile updated!");
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.saveBtnText}>Save Profile</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeModal === "Redeem Code" && (
                <View style={styles.editForm}>
                   <Text style={[styles.modalHint, { color: colors.textMuted }]}>Enter a referral code to get +1 extra export limit.</Text>
                   <TextInput 
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.glassBorder, fontSize: 24, textAlign: 'center', fontWeight: 'bold' }]}
                    value={redeemCode}
                    onChangeText={(t) => setRedeemCode(t.toUpperCase())}
                    placeholder="CODE123"
                    autoCapitalize="characters"
                   />
                   <TouchableOpacity 
                    style={[styles.saveBtn, isRedeeming && { opacity: 0.7 }]} 
                    disabled={isRedeeming}
                    onPress={async () => {
                      setIsRedeeming(true);
                      try {
                        await applyReferralCode(redeemCode);
                        Alert.alert("Success", "Code applied!");
                        setActiveModal(null);
                      } catch (e: any) {
                        Alert.alert("Error", e.message);
                      } finally {
                        setIsRedeeming(false);
                      }
                    }}
                   >
                     {isRedeeming ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Redeem</Text>}
                   </TouchableOpacity>
                </View>
              )}

              {activeModal === "Subscription" && (
                <View style={styles.pricingContainer}>
                  <LinearGradient colors={['#D81B60', '#FF4081']} style={styles.premiumCard}>
                    <View style={styles.premiumHeader}>
                       <Crown size={32} color="#fff" />
                       <Text style={styles.premiumTitle}>Elite Pro</Text>
                    </View>
                    <Text style={styles.premiumPrice}>₹19<Text style={styles.priceSub}>/month</Text></Text>
                    <View style={styles.benefitList}>
                       <Benefit text="Unlimited Exports" />
                       <Benefit text="Premium Templates" />
                       <Benefit text="AI Power Writing" />
                       <Benefit text="No Advertisements" />
                    </View>
                    <TouchableOpacity style={styles.premiumBtn}>
                       <Text style={styles.premiumBtnText}>Get Pro Access</Text>
                    </TouchableOpacity>
                  </LinearGradient>

                  <View style={styles.dividerRow}>
                    <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                    <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
                    <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                  </View>

                  <TouchableOpacity 
                    style={[styles.adCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}
                    onPress={showAd}
                  >
                    <View style={styles.adInfo}>
                      <View style={[styles.adIconBox, { backgroundColor: Theme.colors.primary + '15' }]}>
                         {isAdLoaded ? <Sparkles size={20} color={Theme.colors.primary} /> : <ActivityIndicator size="small" color={Theme.colors.primary} />}
                      </View>
                      <View>
                        <Text style={[styles.adTitleSmall, { color: colors.text }]}>Free Daily Pass ({adsWatched}/3)</Text>
                        <Text style={[styles.adSubSmall, { color: colors.textMuted }]}>Watch 3 Ads for 3 Free Exports</Text>
                      </View>
                    </View>
                    <View style={styles.validityBadge}>
                       <Text style={styles.validityText}>Valid 24h</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.bannerContainer}>
                    {bannerId ? (
                      <BannerAd
                        unitId={bannerId}
                        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                        requestOptions={{
                          requestNonPersonalizedAdsOnly: true,
                        }}
                        onAdFailedToLoad={(error) => console.log('Banner failed to load:', error)}
                      />
                    ) : null}
                  </View>
                </View>
              )}

              {activeModal === "Settings" && (
                <View style={styles.editForm}>
                  <View style={[styles.settingsItem, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.settingsLabel, { color: colors.text }]}>Dark Mode</Text>
                    <Switch value={isDark} onValueChange={toggleTheme} />
                  </View>
                  <View style={[styles.settingsItem, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.settingsLabel, { color: colors.text }]}>Push Notifications</Text>
                    <Switch value={notifications} onValueChange={setNotifications} />
                  </View>
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

function Field({ label, value, onChange, colors }: any) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput 
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.glassBorder }]} 
        value={value} 
        onChangeText={onChange} 
      />
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

  menuWrapper: { borderRadius: 24, padding: 10, marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 5 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  menuInfo: { flex: 1, marginLeft: 15 },
  menuLabel: { fontSize: 15, fontWeight: "700" },
  menuSub: { fontSize: 11, marginTop: 2 },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },

  sectionTitleSmall: { fontSize: 13, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 5 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, paddingHorizontal: 5 },
  linkText: { fontSize: 14, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1 },
  modalContent: { flex: 1, padding: 25 },
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
  bannerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
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

  menuWrapper: { borderRadius: 24, padding: 10, marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 5 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  menuInfo: { flex: 1, marginLeft: 15 },
  menuLabel: { fontSize: 15, fontWeight: "700" },
  menuSub: { fontSize: 11, marginTop: 2 },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },

  sectionTitleSmall: { fontSize: 13, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 5 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, paddingHorizontal: 5 },
  linkText: { fontSize: 14, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1 },
  modalContent: { flex: 1, padding: 25 },
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
  bannerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
