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
    Download
} from "lucide-react-native";
import React, { useState } from "react";
import {
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { exportToPDF } from "@/utils/resume-exporter";
import { ResumeData } from "@/components/resume-templates";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { toggleTheme } = useThemeStore();
  const colorScheme = useColorScheme();
  const [notifications, setNotifications] = useState(true);

  const isDark = colorScheme === "dark"; // Uses global state
  const colors = isDark ? Colors.dark : Colors.light;

  const [referralCode] = useState("RESUME-PRO-AJ");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [savedTab, setSavedTab] = useState<"Resumes" | "Jobs">("Resumes");

  // Profile Data States
  const [name, setName] = useState("Alex Johnson");
  const [email, setEmail] = useState(user?.email || "alex.johnson@example.com");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [jobRoles, setJobRoles] = useState<string[]>([
    "Senior UX Designer",
    "Product Manager",
  ]);
  const [location, setLocation] = useState("San Francisco, CA");
  const [education, setEducation] = useState("Master of Design, Stanford");

  // Settings States
  // Moved to top for immediate color reference

  const referrals = [
    { id: "1", name: "Rahul Kumar", date: "2 days ago", status: "Completed" },
    { id: "2", name: "Priya Sharma", date: "5 days ago", status: "Pending" },
    { id: "3", name: "Arun V.", date: "1 week ago", status: "Completed" },
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Boost your career with this Resume Builder! Use my referral code: ${referralCode} to get premium templates for free!`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const menuItems = [
    { icon: UserCircle, label: "Edit Profile" },
    { icon: FileText, label: "My Resumes" },
    { icon: Users, label: "My Referrals" },
    { icon: Settings, label: "Settings" },
    { icon: HelpCircle, label: "Help & Support" },
  ];

  const addJobRole = () => {
    if ((jobRoles || []).length < 5) {
      setJobRoles([...(jobRoles || []), ""]);
    } else {
      Alert.alert("Limit Reached", "You can add up to 5 job roles.");
    }
  };

  const updateJobRole = (text: string, index: number) => {
    const updated = [...jobRoles];
    updated[index] = text;
    setJobRoles(updated);
  };

  const removeJobRole = (index: number) => {
    setJobRoles((jobRoles || []).filter((_, i) => i !== index));
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 10, 40),
          backgroundColor: colors.background,
        },
      ]}
    ><View style={styles.headerRow}><Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text><View style={styles.themeToggle}><Moon size={18} color={isDark ? Theme.colors.primary : colors.textMuted} /><Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: "#d1d5db", true: Theme.colors.primary + '50' }} thumbColor={isDark ? Theme.colors.primary : "#f3f4f6"} /></View></View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Camera size={14} color="#000" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {name}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
              {email}
            </Text>
            <View style={styles.proBadge}>
              <Crown size={12} color="#fff" />
              <Text style={styles.proBadgeText}>PRO Member</Text>
            </View>
          </View>
        </View>

        {/* User Stats/Roles Info */}
        <View
          style={[
            styles.infoSection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <View style={styles.infoRow}>
            <Briefcase size={18} color={Theme.colors.primary} />
            <Text
              style={[styles.infoText, { color: colors.text }]}
              numberOfLines={1}
            >
              {(jobRoles || []).join(" • ") || "No job roles set"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={18} color={Theme.colors.secondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {location}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <GraduationCap size={18} color="#4A90E2" />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {education}
            </Text>
          </View>
        </View>

        {/* Refer & Earn Section */}
        <View
          style={[styles.referSection, { borderColor: colors.glassBorder }]}
        >
          <LinearGradient
            colors={
              isDark
                ? ["rgba(255, 105, 180, 0.2)", "rgba(255, 182, 193, 0.1)"]
                : ["rgba(255, 105, 180, 0.15)", "rgba(255, 192, 203, 0.2)"]
            }
            style={styles.referGradient}
          >
            <View style={styles.referHeader}>
              <Gift size={24} color={Theme.colors.secondary} />
              <Text style={[styles.referTitle, { color: colors.text }]}>
                Refer & Earn
              </Text>
            </View>
            <Text style={[styles.referSubtitle, { color: colors.textMuted }]}>
              Invite friends and get 1 month of PRO for every 3 referrals!
            </Text>

            <View style={styles.codeContainer}>
              <View
                style={[
                  styles.codeBox,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.8)",
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text style={[styles.codeLabel, { color: colors.textMuted }]}>
                  YOUR CODE
                </Text>
                <Text style={styles.codeValue}>{referralCode}</Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
                <Share2 size={20} color="#fff" />
                <Text style={styles.shareText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Items */}
        <View
          style={[
            styles.menuContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => setActiveModal(item.label)}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                  },
                ]}
              >
                <item.icon size={22} color={Theme.colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                {item.label}
              </Text>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert("Notice", "Logging out...")}
        >
          <LogOut size={20} color={Theme.colors.secondary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {activeModal}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.closeBtn}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {activeModal === "Edit Profile" && (
                <View style={styles.formSection}>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={styles.modalAvatarContainer}
                  >
                    {profilePic ? (
                      <Image
                        source={{ uri: profilePic }}
                        style={styles.modalAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.modalAvatar,
                          { backgroundColor: Theme.colors.primary },
                        ]}
                      >
                        <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                      </View>
                    )}
                    <View style={styles.modalCameraIcon}>
                      <Camera size={20} color="#fff" />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Full Name
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                          color: colors.text,
                        },
                      ]}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your name"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Email Address
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                          color: colors.text,
                        },
                      ]}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Location
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                          color: colors.text,
                        },
                      ]}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="e.g. London, UK"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Highest Education
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                          color: colors.text,
                        },
                      ]}
                      value={education}
                      onChangeText={setEducation}
                      placeholder="e.g. Bachelors in Science"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        Job Roles (Up to 5)
                      </Text>
                      <TouchableOpacity onPress={addJobRole}>
                        <Plus size={20} color={Theme.colors.secondary} />
                      </TouchableOpacity>
                    </View>
                    {(jobRoles || []).map((role, index) => (
                      <View key={index} style={styles.roleInputRow}>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              flex: 1,
                              backgroundColor: colors.background,
                              borderColor: colors.glassBorder,
                              color: colors.text,
                            },
                          ]}
                          value={role}
                          onChangeText={(text) => updateJobRole(text, index)}
                          placeholder={`Job Role ${index + 1}`}
                          placeholderTextColor={colors.textMuted}
                        />
                        <TouchableOpacity
                          onPress={() => removeJobRole(index)}
                          style={styles.removeRoleBtn}
                        >
                          <Trash2 size={20} color={Theme.colors.secondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => {
                      Alert.alert("Success", "Profile updated successfully");
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              )}
              {activeModal === "Settings" && (
                <View
                  style={[
                    styles.settingsGroup,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                >
                  <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                      <Moon size={20} color={colors.text} />
                      <Text
                        style={[styles.settingLabel, { color: colors.text }]}
                      >
                        Dark Mode
                      </Text>
                    </View>
                    <Switch
                      value={isDark}
                      onValueChange={toggleTheme}
                      trackColor={{
                        true: Theme.colors.secondary,
                        false: "#e2e8f0",
                      }}
                      thumbColor="#fff"
                    />
                  </View>
                  <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                      <Bell size={20} color={colors.text} />
                      <Text
                        style={[styles.settingLabel, { color: colors.text }]}
                      >
                        Notifications
                      </Text>
                    </View>
                    <Switch
                      value={notifications}
                      onValueChange={(val) => setNotifications(val)}
                      trackColor={{
                        true: Theme.colors.secondary,
                        false: isDark ? "#333" : "#e2e8f0",
                      }}
                      thumbColor={notifications ? "#fff" : "#f4f3f4"}
                    />
                  </View>
                  <TouchableOpacity style={styles.settingLink}>
                    <View style={styles.settingInfo}>
                      <Globe size={20} color={colors.text} />
                      <Text
                        style={[styles.settingLabel, { color: colors.text }]}
                      >
                        Language
                      </Text>
                    </View>
                    <Text style={styles.settingValue}>English</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.settingLink}>
                    <View style={styles.settingInfo}>
                      <Shield size={20} color={colors.text} />
                      <Text
                        style={[styles.settingLabel, { color: colors.text }]}
                      >
                        Privacy Policy
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.settingLink}
                    onPress={() => setActiveModal("Saved Items")}
                  >
                    <View style={styles.settingInfo}>
                      <Bookmark size={20} color={colors.text} />
                      <Text
                        style={[styles.settingLabel, { color: colors.text }]}
                      >
                        Saved Items
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
              {activeModal === "My Referrals" && (
                <View style={styles.helpSection}>
                  <Text style={[styles.helpIntro, { color: colors.textMuted }]}>
                    People you've successfully referred
                  </Text>
                  <View
                    style={[
                      styles.faqList,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                  >
                    {referrals.map((ref) => (
                      <View
                        key={ref.id}
                        style={[
                          styles.faqItem,
                          { borderBottomColor: colors.glassBorder },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.faqText, { color: colors.text }]}>
                            {ref.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{ref.date}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: ref.status === 'Completed' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 165, 0, 0.1)' }]}>
                          <Text style={[styles.statusText, { color: ref.status === 'Completed' ? '#059669' : '#d97706' }]}>{ref.status}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {activeModal === "My Resumes" && (
                <View style={styles.resumesList}>
                  {[
                    { id: '1', name: "Senior UX Designer", date: "Mar 12, 2024", title: "Senior UX Designer" },
                    { id: '2', name: "Product Manager", date: "Mar 18, 2024", title: "Product Manager" }
                  ].map((resume, i) => (
                    <View
                      key={resume.id}
                      style={[
                        styles.savedResumeCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                        },
                      ]}
                    >
                      <FileText size={40} color={Theme.colors.secondary} />
                      <View style={styles.savedResumeInfo}>
                        <Text
                          style={[
                            styles.savedResumeName,
                            { color: colors.text },
                          ]}
                        >
                          {resume.name}
                        </Text>
                        <Text
                          style={[
                            styles.savedResumeDate,
                            { color: colors.textMuted },
                          ]}
                        >
                          Last edited: {resume.date}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.resumeActionBtn}
                        onPress={async () => {
                          const mockResume: ResumeData = {
                            name: "Alex Johnson",
                            title: resume.title,
                            email: "alex.johnson@example.com",
                            phone: "+1 234 567 890",
                            summary: "Strategic leader with over 10 years of experience in leading high-performance product teams and delivering market-leading solutions.",
                            experience: [
                              { role: resume.title, company: "Tech Solutions", period: "2018 - Present", description: "Led development of core cloud products and improved user retention by 45%." },
                              { role: "Product Specialist", company: "NextGen Apps", period: "2015 - 2018", description: "Managed cross-functional teams to launch innovative mobile solutions." }
                            ],
                            skills: "Strategy, Leadership, Cloud Computing, AI, Product Lifecycle, Agile",
                            education: { degree: "Master of Design", school: "Stanford University", year: "2014" }
                          };
                          await exportToPDF(mockResume, 'Modern');
                        }}
                      >
                        <Download size={20} color={Theme.colors.secondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addNewResume}>
                    <Text style={styles.addNewText}>+ Create New Resume</Text>
                  </TouchableOpacity>
                </View>
              )}{" "}
              {activeModal === "Help & Support" && (
                <View style={styles.helpSection}>
                  <Text style={[styles.helpIntro, { color: colors.textMuted }]}>
                    How can we help you today?
                  </Text>
                  <View
                    style={[
                      styles.faqList,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                  >
                    {[
                      "How to export PDF?",
                      "How to change theme?",
                      "Is it free?",
                    ].map((q, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.faqItem,
                          { borderBottomColor: colors.glassBorder },
                        ]}
                      >
                        <Text style={[styles.faqText, { color: colors.text }]}>
                          {q}
                        </Text>
                        <ChevronRight size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.contactBtn,
                      { borderColor: Theme.colors.secondary },
                    ]}
                  >
                    <Text style={styles.contactBtnText}>Contact Support</Text>
                  </TouchableOpacity>
                </View>
              )}
              {activeModal === "Saved Items" && (
                <View style={styles.helpSection}>
                  <View style={styles.savedTabs}>
                    {["Resumes", "Jobs"].map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[
                          styles.savedTab,
                          savedTab === tab && {
                            backgroundColor: Theme.colors.secondary,
                            borderColor: Theme.colors.secondary,
                          },
                        ]}
                        onPress={() => setSavedTab(tab as any)}
                      >
                        <Text
                          style={[
                            styles.savedTabText,
                            { color: colors.text },
                            savedTab === tab && { color: "#fff" },
                          ]}
                        >
                          {tab}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {savedTab === "Resumes" ? (
                    <View style={styles.resumesList}>
                      {[1, 2].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.savedResumeCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.glassBorder,
                            },
                          ]}
                        >
                          <FileText size={32} color={Theme.colors.secondary} />
                          <View style={styles.savedResumeInfo}>
                            <Text
                              style={[
                                styles.savedResumeName,
                                { color: colors.text },
                              ]}
                            >
                              Saved Resume {i}
                            </Text>
                            <Text
                              style={[
                                styles.savedResumeDate,
                                { color: colors.textMuted },
                              ]}
                            >
                              Saved on Mar {i + 5}, 2024
                            </Text>
                          </View>
                          <ChevronRight size={20} color={colors.textMuted} />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.resumesList}>
                      {[1, 2].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.savedResumeCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.glassBorder,
                            },
                          ]}
                        >
                          <Briefcase size={32} color={Theme.colors.primary} />
                          <View style={styles.savedResumeInfo}>
                            <Text
                              style={[
                                styles.savedResumeName,
                                { color: colors.text },
                              ]}
                            >
                              UI Designer @ Tech Co
                            </Text>
                            <Text
                              style={[
                                styles.savedResumeDate,
                                { color: colors.textMuted },
                              ]}
                            >
                              Remote • Full Time
                            </Text>
                          </View>
                          <ChevronRight size={20} color={colors.textMuted} />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  savedTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  savedTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  savedTabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    textTransform: "uppercase",
  },
  infoSection: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  referSection: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
  },
  referGradient: {
    padding: 24,
  },
  referHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  referTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  referSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  codeBox: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.colors.secondary,
    letterSpacing: 1,
  },
  shareBtn: {
    backgroundColor: Theme.colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  sectionContainer: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  referralList: {
    gap: 12,
  },
  referralItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  refInfo: {
    flex: 1,
  },
  refName: {
    fontSize: 15,
    fontWeight: "600",
  },
  refDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  menuContainer: {
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    backgroundColor: "rgba(255, 20, 147, 0.1)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.secondary,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.secondary,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingBottom: 60,
  },
  modalAvatarContainer: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 30,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Theme.colors.secondary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 4,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 4,
  },
  input: {
    borderRadius: 18,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  roleInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  removeRoleBtn: {
    padding: 8,
  },
  saveBtn: {
    backgroundColor: Theme.colors.secondary,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  settingsGroup: {
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingValue: {
    fontSize: 14,
    color: Theme.colors.secondary,
    fontWeight: "700",
  },
  resumesList: {
    gap: 16,
  },
  savedResumeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  savedResumeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  savedResumeName: {
    fontSize: 16,
    fontWeight: "700",
  },
  savedResumeDate: {
    fontSize: 12,
    marginTop: 4,
  },
  resumeActionBtn: {
    padding: 8,
  },
  addNewResume: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Theme.colors.secondary,
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 10,
  },
  addNewText: {
    color: Theme.colors.secondary,
    fontWeight: "800",
    fontSize: 16,
  },
  helpSection: {
    gap: 20,
  },
  helpIntro: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  faqList: {
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  faqText: {
    fontSize: 15,
    fontWeight: "600",
  },
  contactBtn: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  contactBtnText: {
    color: Theme.colors.secondary,
    fontSize: 17,
    fontWeight: "800",
  },
});
