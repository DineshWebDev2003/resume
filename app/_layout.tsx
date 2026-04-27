import { Colors, Theme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Lato_400Regular, Lato_700Bold } from "@expo-google-fonts/lato";
import {
    Montserrat_400Regular,
    Montserrat_700Bold
} from "@expo-google-fonts/montserrat";
import {
    OpenSans_400Regular,
    OpenSans_700Bold,
} from "@expo-google-fonts/open-sans";
import {
    Poppins_400Regular,
    Poppins_700Bold
} from "@expo-google-fonts/poppins";
import { Roboto_400Regular, Roboto_700Bold } from "@expo-google-fonts/roboto";
import {
    DarkTheme,
    ThemeProvider
} from "@react-navigation/native";
import { Buffer } from "buffer";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
    ActivityIndicator,
    View
} from "react-native";
import "react-native-reanimated";
global.Buffer = global.Buffer || Buffer;
global.process = global.process || require("process");

// Polyfill TextDecoder to handle 'ascii' encoding which is used by fontkit
if (typeof TextDecoder !== "undefined") {
  const OriginalTextDecoder = TextDecoder;
  global.TextDecoder = function (encoding, options) {
    const enc =
      encoding === "ascii" || encoding === "latin1" ? "utf-8" : encoding;
    return new OriginalTextDecoder(enc, options);
  };
  global.TextDecoder.prototype = OriginalTextDecoder.prototype;
}

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const theme = useColorScheme();
  const isDark = theme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (
      !user &&
      segments[0] !== "login" &&
      segments[0] !== "terms" &&
      segments[0] !== "privacy" &&
      segments[0] !== "category-templates"
    ) {
      // Redirect to the login page if the user is not authenticated
      router.replace("/login");
    } else if (user && segments[0] === "login") {
      // Redirect to the dashboard if the user is authenticated
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          style={isDark ? "light" : "dark"}
          backgroundColor={isDark ? colors.background : Theme.colors.primary}
          translucent={true}
        />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto: Roboto_400Regular,
    RobotoBold: Roboto_700Bold,
    OpenSans: OpenSans_400Regular,
    OpenSansBold: OpenSans_700Bold,
    Lato: Lato_400Regular,
    LatoBold: Lato_700Bold,
    Poppins: Poppins_400Regular,
    PoppinsBold: Poppins_700Bold,
    Montserrat: Montserrat_400Regular,
    MontserratBold: Montserrat_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
    // Initialize AdMob safely
    try {
      const mobileAds = require("react-native-google-mobile-ads").default;
      mobileAds()
        .initialize()
        .then((adapterStatuses) => {
          console.log("AdMob Initialized");
        });
    } catch (e) {
      console.log("AdMob native module not found, skipping initialization");
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
