import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Theme, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TermsOfServiceScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Last Updated: April 14, 2026</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            By accessing or using Resume Elite, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Use of Service</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Resume Elite provides tools for creating and managing resumes. You are responsible for the content you create and must ensure it complies with applicable laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. User Accounts</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            To access certain features, you may be required to sign in with a third-party account (e.g., Google). You are responsible for maintaining the confidentiality of your account information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Intellectual Property</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            The Resume Elite application, including its designs, code, and original content, is the property of Resume Elite and is protected by intellectual property laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Limitation of Liability</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Resume Elite shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Changes to Terms</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            We reserve the right to modify these terms at any time. Your continued use of the service after such changes constitutes your acceptance of the new terms.
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
