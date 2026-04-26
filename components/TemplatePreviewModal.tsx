import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { X, PenTool } from 'lucide-react-native';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WebView } from 'react-native-webview';
import { generateResumeHtml } from './resume-html-generator';
import { ResumeData } from './resume-templates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MOCK_RESUME: ResumeData = {
  name: "Alex Johnson",
  title: "Senior Product Designer",
  email: "alex.j@example.com",
  phone: "+1 555 000 1111",
  summary: "Results-driven designer with 10+ years of experience in creating elite digital products for global tech leaders.",
  experience: [
    { role: "Senior Designer", company: "Tech Giant", period: "2020 - 2024", description: "Led redesign of core mobile platform, increasing user engagement by 45%." },
    { role: "UX Lead", company: "Innovation Lab", period: "2018 - 2020", description: "Developed design system used across 5 continental offices." }
  ],
  education: { degree: "Fine Arts", school: "Design University", year: "2016" },
  skills: "UX/UI, React Native, Prototyping, Strategy, Systems Thinking",
};

interface TemplatePreviewModalProps {
  visible: boolean;
  templateId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export const TemplatePreviewModal = ({ visible, templateId, onClose, onSelect }: TemplatePreviewModalProps) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const htmlContent = visible ? generateResumeHtml(MOCK_RESUME, templateId, Theme.colors.primary, "Inter", false) : '';

  return (
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContent, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <X size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{templateId} Template</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.previewImageContainer}>
           <WebView
             originWhitelist={['*']}
             source={{ html: htmlContent }}
             style={styles.webView}
             scalesPageToFit={false}
             bounces={false}
             showsVerticalScrollIndicator={false}
             scrollEnabled={true}
           />
        </View>

        <View style={styles.previewInfo}>
          <Text style={[styles.previewName, { color: colors.text }]}>{templateId} Design DNA</Text>
          <Text style={[styles.previewDesc, { color: colors.textMuted }]}>
            A high-impact, professional layout optimized for {templateId === 'Executive' ? 'corporate leadership' : 'modern industries'}. 
            Built with HTML5 & CSS3 for pixel-perfect printing.
          </Text>
        </View>

        <View style={[styles.actionFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: Theme.colors.primary }]}
            onPress={() => onSelect(templateId)}
          >
            <PenTool size={20} color="#fff" />
            <Text style={styles.editButtonText}>Use This Design</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  closeBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  previewImageContainer: { flex: 1, backgroundColor: "#cbd5e1", overflow: 'hidden' },
  webView: { flex: 1, backgroundColor: 'transparent' },
  previewInfo: { padding: 24, paddingBottom: 10 },
  previewName: { fontSize: 22, fontWeight: "900" },
  previewDesc: { fontSize: 14, lineHeight: 22, marginTop: 8 },
  actionFooter: { padding: 24 },
  editButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 20, gap: 10 },
  editButtonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
