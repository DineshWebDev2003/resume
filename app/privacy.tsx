import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Theme, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Last Updated: April 14, 2026</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Information We Collect</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            We collect information you provide directly to us, such as your profile details and resume content. We also collect basic account information when you sign in via third-party services like Google.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. How We Use Information</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            We use the information to provide, maintain, and improve our services, including the creation and storage of your resumes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Data Storage</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Your resumes and profiles are stored securely. We may use local storage and cloud-based services (like Firebase) to manage your data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Information Sharing</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            We do not share your personal information with third parties except as required to provide our services or as required by law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Cookies and Tracking</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            We may use cookies or similar tracking technologies to analyze trends and track user movement around the application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Security</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            We take reasonable measures to protect your personal information from loss, theft, and misuse.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Contact Us</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            If you have any questions about this Privacy Policy, please contact us.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 30,
    fontWeight: "600",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
  },
});
