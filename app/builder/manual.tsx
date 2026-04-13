import { ResumeCanvas } from "@/components/resume-canvas";
import { generateResumeHtml } from "@/components/resume-html-generator";
import {
    CreativeTemplate,
    ExecutiveTemplate,
    ModernTemplate,
    ProfessionalTemplate,
    ResumeData,
} from "@/components/resume-templates";
import { Theme } from "@/constants/theme";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
    ArrowLeft,
    Camera,
    ChevronDown,
    Download,
    Edit2,
    Eye,
    Plus,
    Save,
    Trash2,
} from "lucide-react-native";
import { saveResume, getResumes } from "@/utils/storage";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import { saveResumeToFirestore } from "@/services/firestore";
import { auth } from "@/services/firebase";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Custom Text Wrapper to intercept font families natively. Android refuses to synthesize
// 'bold' weights against custom Google Fonts without explicit font mappings.
const Text = (props: any) => {
  const { style, ...rest } = props;
  let finalStyle = style;

  if (style) {
    const flatStyle = StyleSheet.flatten(style);
    if (
      flatStyle &&
      flatStyle.fontFamily &&
      ["Roboto", "OpenSans", "Lato", "Poppins", "Montserrat"].includes(
        flatStyle.fontFamily,
      )
    ) {
      const isBold =
        flatStyle.fontWeight === "bold" ||
        flatStyle.fontWeight === "600" ||
        flatStyle.fontWeight === "700" ||
        flatStyle.fontWeight === "800";
      if (isBold) {
        flatStyle.fontFamily = flatStyle.fontFamily + "Bold";
        // Remove fontWeight so Android doesn't accidentally try to double-synthesize over the Bold Face causing blocks
        delete flatStyle.fontWeight;
      }
    }
    finalStyle = flatStyle;
  }
  return <RNText {...rest} style={finalStyle} />;
};

const ATS_FONTS = [
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "OpenSans" },
  { name: "Lato", value: "Lato" },
  { name: "Poppins", value: "Poppins" },
  { name: "Montserrat", value: "Montserrat" },
];

const TEMPLATES = ["Executive", "Modern", "Creative", "Professional"];

const TemplateMiniPreview = ({
  template,
  selectedFont,
  resumeData,
  isFeatured,
}: any) => {
  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  const scale = isFeatured ? 0.3 : 0.28;

  const previewData = {
    name: resumeData?.name || "Alex Johnson",
    title: resumeData?.title || "Senior Software Systems Engineer",
    summary:
      resumeData?.summary ||
      "Innovative and results-driven Software Engineer with over 7 years of experience in designing and implementing scalable cloud-native applications. Expert in React Native, Node.js, and Distributed Systems, with a passion for optimizing performance and enhancing user experience.",
    email: resumeData?.email || "alex.johnson@example.com",
    phone: resumeData?.phone || "+1 (555) 234-5678",
    skills: resumeData?.skills || "React Native, TypeScript, Node.js, AWS, Docker, Kubernetes, GraphQL, Tailwind CSS",
    experience:
      resumeData?.experience && resumeData.experience.length > 0
        ? resumeData.experience
        : [
            {
              role: "Senior Systems Architect",
              company: "TechFlow Solutions Inc.",
              period: "2021-Present",
              description: "Leading the development of a microservices architecture that handles 1M+ daily active users. Improved system latency by 45% through strategic caching and query optimization.",
            },
            {
              role: "Lead Frontend Developer",
              company: "Innovation Hub",
              period: "2018-2021",
              description: "Spearheaded the migration of legacy mobile apps to React Native, reducing development time by 30% and maintaining a 4.8-star rating on the App Store.",
            },
            {
              role: "Software Engineer",
              company: "Junior Dev Studios",
              period: "2016-2018",
              description: "Focused on developing interactive UI components and integrating third-party APIs for various fintech clients.",
            },
          ],
    projects:
      resumeData?.projects && resumeData.projects.length > 0
        ? resumeData.projects
        : [
            {
              id: "1",
              title: "Global E-commerce Engine",
              description: "Built a multi-tenant e-commerce platform supporting multiple currencies and languages with integrated Stripe payments.",
            },
            {
              id: "2",
              title: "AI Resume Builder",
              description: "Developed an AI-powered tool that analyzes resumes against job descriptions to provide optimization scores and suggestions.",
            },
          ],
    education: resumeData?.education || {
      degree: "M.S. in Computer Science",
      school: "Western Institute of Technology",
      year: "2018",
    },
  };

  const translateX = -(A4_WIDTH * (1 - scale)) / 2;
  const translateY = -(A4_HEIGHT * (1 - scale)) / 2;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transform: [{ scale }],
        }}
      >
        {template === "Executive" && (
          <ExecutiveTemplate
            resumeData={previewData}
            selectedFont={selectedFont || "Roboto"}
          />
        )}
        {template === "Modern" && (
          <ModernTemplate
            resumeData={previewData}
            selectedFont={selectedFont || "Roboto"}
          />
        )}
        {template === "Creative" && (
          <CreativeTemplate
            resumeData={previewData}
            selectedFont={selectedFont || "Roboto"}
          />
        )}
        {template === "Professional" && (
          <ProfessionalTemplate
            resumeData={previewData}
            selectedFont={selectedFont || "Roboto"}
          />
        )}
      </View>
    </View>
  );
};

export default function ManualBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const viewShotRef = useRef<any>(null);
  const [previewLayout, setPreviewLayout] = useState({
    width: 794,
    height: 1123,
  });

  const initialTheme = "Professional";
  const themeColor = (params.color as string) || Theme.colors.primary;

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("preview"); // Default to preview when coming from a specific selection
  const [fontMenuVisible, setFontMenuVisible] = useState(false);
  const [templateMenuVisible, setTemplateMenuVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    width: 794,
    height: 1123,
    label: "A4",
  });
  const [customWidth, setCustomWidth] = useState("794");
  const [customHeight, setCustomHeight] = useState("1123");

  // Sync state with navigation params
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    (params.theme as string) || "Executive",
  );
  const [selectedFont, setSelectedFont] = useState(ATS_FONTS[0].value);

  const [resumeData, setResumeData] = useState<any>({
    photo: "",
    name: (params.name as string) || "Alex Johnson",
    title: (params.role as string) || "Senior Software Systems Engineer",
    email: "alex.johnson@example.com",
    phone: "+1 (555) 234-5678",
    summary:
      (params.summary as string) ||
      "Innovative and results-driven Software Engineer with over 7 years of experience in designing and implementing scalable cloud-native applications. Expert in React Native, Node.js, and Distributed Systems, with a passion for optimizing performance and enhancing user experience.",
    experience: [
      {
        id: "1",
        company: "TechFlow Solutions Inc.",
        role: "Senior Systems Architect",
        period: "Jan 2021 - Present",
        salary: "$120k - $160k",
        workType: "Full-time",
        description: "Leading the development of a microservices architecture that handles 1M+ daily active users. Improved system latency by 45% through strategic caching and query optimization.",
      },
      {
        id: "2",
        company: "Innovation Hub",
        role: "Lead Frontend Developer",
        period: "Aug 2018 - Jan 2021",
        salary: "$90k - $110k",
        workType: "Full-time",
        description: "Spearheaded the migration of legacy mobile apps to React Native, reducing development time by 30% and maintaining a 4.8-star rating on the App Store.",
      },
    ],
    projects: [
      {
        id: "1",
        title: "Global E-commerce Engine",
        description: "Built a multi-tenant e-commerce platform supporting multiple currencies and languages with integrated Stripe payments.",
      },
    ],
    education: { school: "Western Institute of Technology", degree: "M.S. in Computer Science", year: "2018" },
    skills: "React Native, TypeScript, Node.js, AWS (Lambda, S3, RDS), Docker, Kubernetes, GraphQL, Tailwind CSS, CI/CD, Agile Methodologies",
  });

  useEffect(() => {
    if (params.theme) setSelectedTemplate(params.theme as string);
    if (params.name || params.role || params.summary) {
      setResumeData((prev: any) => ({
        ...prev,
        name: (params.name as string) || prev.name,
        title: (params.role as string) || prev.title,
        summary: (params.summary as string) || prev.summary,
      }));
    }
  }, [params.theme, params.name, params.role, params.summary]);

  useFocusEffect(
    useCallback(() => {
      const loadResume = async () => {
        if (params.resumeId) {
          const resumes = await getResumes();
          const found = resumes.find(r => r.id === params.resumeId);
          if (found) {
            setResumeData(found.data);
            setSelectedTemplate(found.template);
          }
        }
      };
      loadResume();
    }, [params.resumeId])
  );

  const handleUpdateExperience = (id: string, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    }));
  };

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: Date.now().toString(),
          company: "",
          role: "",
          period: "",
          salary: "",
          workType: "",
          description: "",
        },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  const handleUpdateProject = (id: string, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj,
      ),
    }));
  };

  const addProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: Date.now().toString(),
          title: "",
          description: "",
        },
      ],
    }));
  };

  const removeProject = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        Alert.alert("Uploading", "Uploading image to Cloudinary...");
        const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
        setResumeData((prev) => ({ ...prev, photo: imageUrl }));
        Alert.alert("Success", "Image uploaded successfully!");
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        Alert.alert("Error", "Failed to upload image to Cloudinary. Check your credentials.");
      }
    }
  };

  const removePhoto = () => setResumeData((prev) => ({ ...prev, photo: "" }));

  const handleSaveToApp = async () => {
    const resumePayload = {
      name: resumeData.name,
      role: resumeData.title,
      template: selectedTemplate,
      color: themeColor,
      data: resumeData as ResumeData,
    };

    const result = await saveResume(resumePayload, params.resumeId as string);

    if (result.success) {
      // Also save to Firestore if user is logged in
      if (auth.currentUser) {
        try {
          await saveResumeToFirestore(resumePayload, params.resumeId as string);
          console.log("Saved to Firestore successfully");
        } catch (e) {
          console.error("Firestore save error:", e);
        }
      }
      
      Alert.alert("Success", result.message);
      router.replace("/(tabs)/resumes");
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfWidth = 794;
      const pdfHeight = 1123;

      const htmlDocument = generateResumeHtml(
        resumeData as ResumeData,
        selectedTemplate,
        themeColor,
        selectedFont,
        exportSettings.width,
        exportSettings.height,
      );

      const { uri } = await Print.printToFileAsync({
        html: htmlDocument,
        width: exportSettings.width,
        height: exportSettings.height,
      });

      await saveFileLocally(
        uri,
        `${resumeData.name.replace(/\s+/g, "_")}_Resume.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const saveFileLocally = async (uri: string, filename: string) => {
    try {
      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64Data = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const newFileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              filename,
              "application/pdf",
            );
          await FileSystem.writeAsStringAsync(newFileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          Alert.alert("Success", "Resume saved to Downloads perfectly!");
          return;
        }
      }
      // Fallback for iOS natively or rejected Android SAF
      await Sharing.shareAsync(uri, {
        UTI: "public.pdf",
        dialogTitle: "Save your Resume",
      });
    } catch (err) {
      console.error("Failed to save via FileSystem", err);
      // Failsafe sharing mechanism
      await Sharing.shareAsync(uri);
    }
  };

  const handleExportAsImage = async () => {
    try {
      if (activeTab !== "preview") {
        setActiveTab("preview");
        // Wait for preview to render
        setTimeout(async () => {
          const uri = await viewShotRef.current?.capture();
          if (uri) {
            await saveFileLocally(
              uri,
              `${resumeData.name.replace(/\s+/g, "_")}_Resume.png`,
            );
          }
        }, 600);
      } else {
        const uri = await viewShotRef.current?.capture();
        if (uri) {
          await saveFileLocally(
            uri,
            `${resumeData.name.replace(/\s+/g, "_")}_Resume.png`,
          );
        }
      }
    } catch (error) {
      console.error("Error exporting image:", error);
      Alert.alert("Error", "Could not export as image");
    }
  };

  const handleDownloadImage = async () => {
    try {
      if (activeTab !== "preview") {
        setActiveTab("preview");
        // Increased delay slightly for full render
        setTimeout(handleExportAsImage, 800);
      } else {
        handleExportAsImage();
      }
    } catch (error) {
      console.error("Error with image download prep:", error);
    }
  };

  const captureAndShare = async () => {
    try {
      if (viewShotRef.current) {
        // Capture as raw base64 data-uri so the PDF generator can immediately digest it locally
        const dataUri = await viewShotRef.current.capture({
          format: "jpg",
          quality: 1,
          result: "data-uri",
        });

        const pdfWidth = exportSettings.width;
        const pdfHeight = exportSettings.height;

        const htmlDocument = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=${pdfWidth}, initial-scale=1.0">
              <style>
                @page { size: ${pdfWidth}px ${pdfHeight}px; margin: 0; }
                body {
                  margin: 0;
                  padding: 0;
                  width: ${pdfWidth}px;
                  height: ${pdfHeight}px;
                  background-color: #fff;
                }
                img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  display: block;
                }
              </style>
            </head>
            <body>
              <img src="${dataUri}" />
            </body>
          </html>
        `;

        const { uri: pdfUri } = await Print.printToFileAsync({
          html: htmlDocument,
          width: pdfWidth,
          height: pdfHeight,
        });
        await saveFileLocally(
          pdfUri,
          `${resumeData.name.replace(/\s+/g, "_")}_Snapshot.pdf`,
        );
      }
    } catch (error) {
      console.error("Error generating image-based PDF:", error);
    }
  };

  const showDownloadOptions = () => {
    Alert.alert("Finish Resume", "Save to app or export to file", [
      { text: "Cancel", style: "cancel" },
      { text: "Save to App", onPress: handleSaveToApp },
      { text: "PDF Settings", onPress: () => setSettingsModalVisible(true) },
      { text: "Download PDF", onPress: handleDownloadPDF },
    ]);
  };

  const renderEditor = () => (
    <ScrollView
      contentContainerStyle={styles.editorScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.editorSection}>
        <Text style={styles.editorSectionTitle}>Personal Info</Text>

        <View style={styles.photoPickerContainer}>
          <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImage}>
            {resumeData.photo ? (
              <Image
                source={{ uri: resumeData.photo }}
                style={styles.photoPreviewImage}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={24} color="#888" />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {resumeData.photo !== "" && (
            <TouchableOpacity
              onPress={removePhoto}
              style={styles.removePhotoBtn}
            >
              <Text style={styles.removePhotoText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={styles.input}
          value={resumeData.name}
          onChangeText={(t) => setResumeData({ ...resumeData, name: t })}
          placeholder="Full Name"
        />
        <TextInput
          style={styles.input}
          value={resumeData.title}
          onChangeText={(t) => setResumeData({ ...resumeData, title: t })}
          placeholder="Professional Title"
        />
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            value={resumeData.email}
            onChangeText={(t) => setResumeData({ ...resumeData, email: t })}
            placeholder="Email"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            value={resumeData.phone}
            onChangeText={(t) => setResumeData({ ...resumeData, phone: t })}
            placeholder="Phone"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.editorSection}>
        <Text style={styles.editorSectionTitle}>Professional Summary</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={resumeData.summary}
          onChangeText={(t) => setResumeData({ ...resumeData, summary: t })}
          placeholder="Summary of your background..."
          multiline
        />
      </View>

      <View style={styles.editorSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.editorSectionTitle}>Experience</Text>
          <TouchableOpacity style={styles.addBtn} onPress={addExperience}>
            <Plus size={16} color={Theme.colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {resumeData.experience.map((exp, index) => (
          <View key={exp.id} style={styles.experienceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>Role {index + 1}</Text>
              <TouchableOpacity onPress={() => removeExperience(exp.id)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={exp.role}
              onChangeText={(t) => handleUpdateExperience(exp.id, "role", t)}
              placeholder="Job Title"
            />
            <TextInput
              style={styles.input}
              value={exp.company}
              onChangeText={(t) => handleUpdateExperience(exp.id, "company", t)}
              placeholder="Company"
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={exp.period}
                onChangeText={(t) =>
                  handleUpdateExperience(exp.id, "period", t)
                }
                placeholder="Duration"
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                value={exp.workType}
                onChangeText={(t) =>
                  handleUpdateExperience(exp.id, "workType", t)
                }
                placeholder="Work Type (Full-time/Remote)"
              />
            </View>
            <TextInput
              style={styles.input}
              value={exp.salary}
              onChangeText={(t) => handleUpdateExperience(exp.id, "salary", t)}
              placeholder="Salary (Optional)"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={exp.description}
              onChangeText={(t) =>
                handleUpdateExperience(exp.id, "description", t)
              }
              placeholder="Job Description..."
              multiline
            />
          </View>
        ))}
      </View>

      <View style={styles.editorSection}>
        <Text style={styles.editorSectionTitle}>Education</Text>
        <TextInput
          style={styles.input}
          value={resumeData.education.degree}
          onChangeText={(t) =>
            setResumeData({
              ...resumeData,
              education: { ...resumeData.education, degree: t },
            })
          }
          placeholder="Degree"
        />
        <TextInput
          style={styles.input}
          value={resumeData.education.school}
          onChangeText={(t) =>
            setResumeData({
              ...resumeData,
              education: { ...resumeData.education, school: t },
            })
          }
          placeholder="School / University"
        />
        <TextInput
          style={styles.input}
          value={resumeData.education.year}
          onChangeText={(t) =>
            setResumeData({
              ...resumeData,
              education: { ...resumeData.education, year: t },
            })
          }
          placeholder="Graduation Year"
        />
      </View>

      <View style={styles.editorSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.editorSectionTitle}>Projects</Text>
          <TouchableOpacity style={styles.addBtn} onPress={addProject}>
            <Plus size={16} color={Theme.colors.primary} />
            <Text style={styles.addBtnText}>Add Project</Text>
          </TouchableOpacity>
        </View>

        {resumeData.projects.map((proj, index) => (
          <View key={proj.id} style={styles.experienceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>Project {index + 1}</Text>
              <TouchableOpacity onPress={() => removeProject(proj.id)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={proj.title}
              onChangeText={(t) => handleUpdateProject(proj.id, "title", t)}
              placeholder="Project Title"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={proj.description}
              onChangeText={(t) =>
                handleUpdateProject(proj.id, "description", t)
              }
              placeholder="Project Description..."
              multiline
            />
          </View>
        ))}
      </View>

      <View style={styles.editorSection}>
        <Text style={styles.editorSectionTitle}>Skills</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={resumeData.skills}
          onChangeText={(t) => setResumeData({ ...resumeData, skills: t })}
          placeholder="Comma separated skills..."
          multiline
        />
      </View>
    </ScrollView>
  );

  const renderPreview = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarScroll}
        >
          <TouchableOpacity
            style={[
              styles.toolbarChip,
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                marginRight: 10,
              },
            ]}
            onPress={() => setTemplateMenuVisible(true)}
          >
            <Text style={[styles.toolbarChipText, { color: "#000" }]}>
              Template: {selectedTemplate}
            </Text>
            <ChevronDown size={14} color="#666" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolbarChip,
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e2e8f0",
              },
            ]}
            onPress={() => setFontMenuVisible(true)}
          >
            <Text style={[styles.toolbarChipText, { color: "#000" }]}>
              Font: {ATS_FONTS.find((f) => f.value === selectedFont)?.name}
            </Text>
            <ChevronDown size={14} color="#666" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={fontMenuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFontMenuVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPress={() => setFontMenuVisible(false)}
          >
            <View
              style={{
                width: "80%",
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <RNText
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                Select Font
              </RNText>
              {ATS_FONTS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={{
                    paddingVertical: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f5f9",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setSelectedFont(f.value);
                    setFontMenuVisible(false);
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 16,
                      fontFamily: f.value,
                      color:
                        selectedFont === f.value
                          ? Theme.colors.primary
                          : "#000",
                    }}
                  >
                    {f.name}
                  </RNText>
                  {selectedFont === f.value && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: Theme.colors.primary,
                      }}
                    />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setFontMenuVisible(false)}
                style={{
                  marginTop: 20,
                  paddingVertical: 12,
                  alignItems: "center",
                  backgroundColor: "#f1f5f9",
                  borderRadius: 12,
                }}
              >
                <RNText style={{ fontWeight: "bold", color: "#666" }}>
                  Cancel
                </RNText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={templateMenuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setTemplateMenuVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPress={() => setTemplateMenuVisible(false)}
          >
            <View
              style={{
                width: "90%",
                maxHeight: "80%",
                backgroundColor: "#fff",
                borderRadius: 30,
                padding: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <RNText
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  marginBottom: 24,
                  textAlign: "center",
                  color: "#0f172a",
                }}
              >
                Select Template
              </RNText>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                {TEMPLATES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={{
                      width: "47%",
                      marginBottom: 10,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor:
                        selectedTemplate === t
                          ? Theme.colors.primary
                          : "#e2e8f0",
                      overflow: "hidden",
                      backgroundColor: "#fff",
                    }}
                    onPress={() => {
                      setSelectedTemplate(t);
                      setTemplateMenuVisible(false);
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        aspectRatio: 1 / 1.414,
                        backgroundColor: "#f8fafc",
                      }}
                    >
                      <TemplateMiniPreview
                        template={t}
                        selectedFont={selectedFont}
                        resumeData={resumeData}
                      />
                    </View>
                    <View
                      style={{
                        padding: 10,
                        backgroundColor:
                          selectedTemplate === t
                            ? Theme.colors.primary
                            : "#f8fafc",
                      }}
                    >
                      <RNText
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          textAlign: "center",
                          color: selectedTemplate === t ? "#fff" : "#475569",
                        }}
                      >
                        {t.toUpperCase()}
                      </RNText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => setTemplateMenuVisible(false)}
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                }}
              >
                <RNText style={{ fontWeight: "800", color: "#64748b" }}>
                  Cancel
                </RNText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={settingsModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSettingsModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            activeOpacity={1}
            onPress={() => setSettingsModalVisible(false)}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                padding: 25,
                paddingBottom: 40,
              }}
            >
              <RNText
                style={{
                  fontSize: 20,
                  fontWeight: "900",
                  marginBottom: 20,
                  color: "#0f172a",
                }}
              >
                PDF Export Settings
              </RNText>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 25,
                }}
              >
                {[
                  { label: "A4", w: 794, h: 1123 },
                  { label: "Letter", w: 816, h: 1056 },
                  { label: "Legal", w: 816, h: 1344 },
                  { label: "Custom", w: 0, h: 0 },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.label}
                    onPress={() => {
                      if (s.label !== "Custom") {
                        setExportSettings({
                          width: s.w,
                          height: s.h,
                          label: s.label,
                        });
                        setCustomWidth(s.w.toString());
                        setCustomHeight(s.h.toString());
                      } else {
                        setExportSettings({
                          ...exportSettings,
                          label: "Custom",
                        });
                      }
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor:
                        exportSettings.label === s.label
                          ? Theme.colors.primary
                          : "#f1f5f9",
                      borderWidth: 1,
                      borderColor:
                        exportSettings.label === s.label
                          ? Theme.colors.primary
                          : "#e2e8f0",
                    }}
                  >
                    <RNText
                      style={{
                        color:
                          exportSettings.label === s.label ? "#fff" : "#475569",
                        fontWeight: "700",
                      }}
                    >
                      {s.label}
                    </RNText>
                  </TouchableOpacity>
                ))}
              </View>

              {exportSettings.label === "Custom" && (
                <View
                  style={{ flexDirection: "row", gap: 15, marginBottom: 25 }}
                >
                  <View style={{ flex: 1 }}>
                    <RNText
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#64748b",
                        marginBottom: 8,
                      }}
                    >
                      WIDTH (PX)
                    </RNText>
                    <TextInput
                      style={{
                        backgroundColor: "#f8fafc",
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                      value={customWidth}
                      keyboardType="number-pad"
                      onChangeText={(t) => {
                        setCustomWidth(t);
                        const w = parseInt(t) || 0;
                        setExportSettings((prev) => ({ ...prev, width: w }));
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <RNText
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#64748b",
                        marginBottom: 8,
                      }}
                    >
                      HEIGHT (PX)
                    </RNText>
                    <TextInput
                      style={{
                        backgroundColor: "#f8fafc",
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                      value={customHeight}
                      keyboardType="number-pad"
                      onChangeText={(t) => {
                        setCustomHeight(t);
                        const h = parseInt(t) || 0;
                        setExportSettings((prev) => ({ ...prev, height: h }));
                      }}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                style={{
                  backgroundColor: Theme.colors.primary,
                  padding: 16,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <RNText
                  style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}
                >
                  Save Settings
                </RNText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      <ScrollView
        contentContainerStyle={styles.previewScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResumeCanvas
          ref={viewShotRef}
          width={exportSettings.width}
          height={exportSettings.height}
        >
          {selectedTemplate === "Executive" && (
            <ExecutiveTemplate
              selectedFont={selectedFont}
              resumeData={resumeData as ResumeData}
              width={exportSettings.width}
              height={exportSettings.height}
            />
          )}
          {selectedTemplate === "Modern" && (
            <ModernTemplate
              selectedFont={selectedFont}
              resumeData={resumeData as ResumeData}
              width={exportSettings.width}
              height={exportSettings.height}
            />
          )}
          {selectedTemplate === "Creative" && (
            <CreativeTemplate
              selectedFont={selectedFont}
              resumeData={resumeData as ResumeData}
              width={exportSettings.width}
              height={exportSettings.height}
            />
          )}
          {selectedTemplate === "Professional" && (
            <ProfessionalTemplate
              selectedFont={selectedFont}
              resumeData={resumeData as ResumeData}
              width={exportSettings.width}
              height={exportSettings.height}
            />
          )}
        </ResumeCanvas>
      </ScrollView>
      <View style={styles.adContainer}>
        <View style={styles.adMock}>
          <RNText style={styles.adText}>ADVERTISEMENT</RNText>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeTab === "edit" && styles.toggleBtnActive,
            ]}
            onPress={() => setActiveTab("edit")}
          >
            <Edit2 size={16} color={activeTab === "edit" ? "#000" : "#888"} />
            <Text
              style={[
                styles.toggleText,
                activeTab === "edit" && styles.toggleTextActive,
              ]}
            >
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              activeTab === "preview" && styles.toggleBtnActive,
            ]}
            onPress={() => setActiveTab("preview")}
          >
            <Eye size={16} color={activeTab === "preview" ? "#000" : "#888"} />
            <Text
              style={[
                styles.toggleText,
                activeTab === "preview" && styles.toggleTextActive,
              ]}
            >
              Preview
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={showDownloadOptions}>
          <Download size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {activeTab === "edit" ? renderEditor() : renderPreview()}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 10,
  },
  adContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  adMock: {
    width: "100%",
    height: 60,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  adText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 2,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    padding: 4,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  toggleTextActive: {
    color: "#000",
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  // Editor Styles
  editorScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  editorSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  editorSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  photoPickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  photoPickerBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoText: {
    fontSize: 10,
    color: "#888",
    fontWeight: "600",
  },
  photoPreviewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removePhotoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },
  removePhotoText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#000",
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: Theme.colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  experienceCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fafaf9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },

  // Preview / Canvas Styles
  toolbar: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 12,
  },
  toolbarScroll: {
    paddingHorizontal: 20,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  toolbarLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    marginRight: 4,
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#ddd",
    marginHorizontal: 8,
  },
  toolbarChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  toolbarChipActive: {
    backgroundColor: Theme.colors.primary,
  },
  toolbarChipText: {
    fontSize: 13,
    color: "#444",
  },
  toolbarChipTextActive: {
    color: "#000",
    fontWeight: "700",
  },
  previewScrollContent: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  documentPage: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    width: "100%",
    aspectRatio: 1 / 1.4142, // Exactly forces 1.414 ratio constraint explicitly as requested
    padding: "4%",
  },
  scaleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
});
