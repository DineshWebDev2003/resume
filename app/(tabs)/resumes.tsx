import { Colors, Theme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteResume, getResumes, UserResume } from "@/utils/storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Briefcase,
  Code,
  FileText,
  GraduationCap,
  Heart,
  Layers,
  Plus,
  Trash2,
  Zap,
  ShieldCheck,
  MoreVertical,
  SlidersHorizontal,
  ChevronRight,
  Crown,
} from "lucide-react-native";
import {
  CreativeTemplate,
  ExecutiveTemplate,
  ModernTemplate,
  ProfessionalTemplate,
} from "@/components/resume-templates";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_WIDTH = SCREEN_WIDTH - 40;
const SPACING = 15;
const SIDE_PEEK = 20;

const CATEGORIES = [
  {
    id: "it",
    name: "IT & Software",
    icon: Code,
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "accounts",
    name: "Accounts",
    icon: Briefcase,
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: Zap,
    image:
      "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "healthcare",
    name: "Medical",
    icon: Heart,
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80",
  },
];

const ALL_TEMPLATES = [
  { key: 't1', id: 'executive', name: 'Executive', isPro: false },
  { key: 't2', id: 'modern', name: 'Modern', isPro: true },
  { key: 't3', id: 'creative', name: 'Creative', isPro: false },
  { key: 't4', id: 'professional', name: 'Professional', isPro: true },
  { key: 't5', id: 'modern', name: 'Minimal', isPro: false },
  { key: 't6', id: 'professional', name: 'Elite Pro', isPro: true },
  { key: 't7', id: 'creative', name: 'Fancy Pink', isPro: false },
  { key: 't8', id: 'executive', name: 'Classic Grey', isPro: false },
  { key: 't9', id: 'modern', name: 'Bold Impact', isPro: true },
  { key: 't10', id: 'professional', name: 'Developer', isPro: false },
];

const TemplateMiniPreview = ({ id, colors, isDark }: { id: string, colors: any, isDark: boolean }) => {
  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  const scale = 0.26; 

  const mockData = {
    name: "Alex Johnson",
    title: "Senior Product Designer",
    email: "alex.j@example.com",
    phone: "+1 555 000 1234",
    summary: "Creative designer with a focus on user-centric interfaces. 8 years experience.",
    experience: [
      { role: "Design Lead", company: "Pixel Studio", period: "2019 - Present", description: "Spearheaded rebranding for international clients." },
    ],
    skills: "UI/UX, Figma, React, Adobe Suite",
    education: { degree: "BFA Design", school: "Design Academy", year: "2015" }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ width: A4_WIDTH, height: A4_HEIGHT, transform: [{ scale }] }}>
        {id === 'executive' && <ExecutiveTemplate resumeData={mockData} selectedFont="Roboto" />}
        {id === 'modern' && <ModernTemplate resumeData={mockData} selectedFont="Roboto" />}
        {id === 'creative' && <CreativeTemplate resumeData={mockData} selectedFont="Roboto" />}
        {id === 'professional' && <ProfessionalTemplate resumeData={mockData} selectedFont="Roboto" />}
      </View>
    </View>
  );
};

function CategoryCard({
  item,
  index,
  scrollX,
  selectedCategory,
  setSelectedCategory,
  colors,
  router,
}: any) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + SPACING),
      index * (CARD_WIDTH + SPACING),
      (index + 1) * (CARD_WIDTH + SPACING),
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[animatedStyle, { width: CARD_WIDTH, marginRight: SPACING }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setSelectedCategory(item.id);
          router.push({
            pathname: "/category-templates",
            params: { categoryId: item.id, categoryName: item.name }
          } as any);
        }}
        style={[
          styles.bigCatCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        <View style={styles.bigCatImageContainer}>
          <Image source={{ uri: item.image }} style={styles.bigCatImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
            style={styles.bigCatOverlay}
          />
          <View style={styles.bigCatInfo}>
            <View
              style={[
                styles.catIconCircleBig,
                { backgroundColor: "rgba(255, 255, 255, 0.25)" },
              ]}
            >
              <item.icon size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.bigCatName}>{item.name}</Text>
              <Text style={styles.bigCatSub}>Professional Templates</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}



export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("it");

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  // Create looped data for infinite carousel
  const [loopedData] = useState([...CATEGORIES, ...CATEGORIES, ...CATEGORIES]);
  const totalItems = CATEGORIES.length;
  const loopIndexOffset = totalItems; // Middle set start

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  useEffect(() => {
    // Initial scroll to middle set
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: loopIndexOffset,
        animated: false,
      });
    }, 100);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      // Auto-slide logic for looped data
      const nextIndex = Math.round(scrollX.value / (CARD_WIDTH + SPACING)) + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      // Handle loop reset silently in onMomentumScrollEnd
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const loadData = async () => {
    setLoading(true);
    const data = await getResumes();
    setResumes(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Resume",
      "Are you sure you want to delete this resume?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteResume(id);
            loadData();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Templates
        </Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: Theme.colors.primary }]}
          onPress={() => router.push("/builder/manual")}
        >
          <Plus size={18} color="#000" />
          <Text style={styles.newButtonText}>Quick Create</Text>
        </TouchableOpacity>
      </View>



      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >


        {/* Categories Section - Auto Carousel */}
        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 30,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Explore Fields
          </Text>
          <View style={styles.paginationDots}>
            {CATEGORIES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      currentIndex === i
                        ? Theme.colors.primary
                        : colors.glassBorder,
                    width: currentIndex === i ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Animated.FlatList
          ref={flatListRef}
          data={loopedData}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: SIDE_PEEK }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / (CARD_WIDTH + SPACING),
            );

            // Loop adjustment: if user scrolls too far left or right, jump to middle set
            if (index < totalItems) {
              flatListRef.current?.scrollToIndex({
                index: index + totalItems,
                animated: false,
              });
              setCurrentIndex((index + totalItems) % totalItems);
            } else if (index >= totalItems * 2) {
              flatListRef.current?.scrollToIndex({
                index: index - totalItems,
                animated: false,
              });
              setCurrentIndex((index - totalItems) % totalItems);
            } else {
              setCurrentIndex(index % totalItems);
            }
          }}
          keyExtractor={(_, index) => `cat-loop-${index}`}
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH + SPACING,
            offset: (CARD_WIDTH + SPACING) * index,
            index,
          })}
          renderItem={({ item, index }) => {
            return (
              <CategoryCard
                item={item}
                index={index}
                scrollX={scrollX}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                colors={colors}
                router={router}
              />
            );
          }}
        />

        {/* Explore Templates Section - 2 Column Grid */}
        <View
          style={[
            styles.sectionHeader,
            {
              marginTop: 40,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Explore Templates
          </Text>
        </View>

        <View style={styles.recentsGrid}>
          {ALL_TEMPLATES.map((template, i) => (
            <Animated.View
              key={template.key}
              entering={FadeInDown.delay(100 + i * 50)}
              style={styles.recentCardWrapper}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/builder/manual",
                    params: { templateId: template.id },
                  } as any)
                }
                style={[
                  styles.templateRawCard,
                  { borderColor: colors.glassBorder },
                ]}
              >
                <View style={[styles.recentImageContainer, { marginBottom: 0 }]}>
                  <TemplateMiniPreview id={template.id} colors={colors} isDark={isDark} />
                  {template.isPro && (
                    <View style={styles.proBadgeMini}>
                      <Crown size={10} color="#fff" />
                    </View>
                  )}
                </View>
                <View style={styles.templateLabelOverlay}>
                  <Text style={[styles.templateLabelText, { color: '#fff' }]} numberOfLines={1}>
                    {template.name}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  newButtonText: {
    fontWeight: "800",
    color: "#fff",
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
  },

  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
  },
  recentCardWrapper: {
    width: "50%",
    padding: 6,
  },
  recentCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  recentImageContainer: {
    aspectRatio: 1 / 1.4142,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  recentSnapshot: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  recentPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  recentTextContainer: {
    flex: 1,
    marginRight: 6,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "700",
  },
  recentTime: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    opacity: 0.7,
  },
  recentMenu: {
    padding: 4,
  },
  addCardGrid: {
    aspectRatio: 1 / 1.35,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addCardText: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyPrompt: {
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.1)",
  },
  emptyPromptText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: "600",
  },
  proBadgeMini: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Theme.colors.secondary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  templateRawCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  templateLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  templateLabelText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  paginationDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bigCatCard: {
    width: "100%",
    height: 180,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  bigCatImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  bigCatImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bigCatOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
  },
  bigCatInfo: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
  },
  catIconCircleBig: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bigCatName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bigCatSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
});
