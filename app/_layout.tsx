import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAuth, AuthProvider } from '@/hooks/use-auth';
import { useColorScheme, useThemeStore } from '@/hooks/use-color-scheme';
import { View, ActivityIndicator, SafeAreaView, useColorScheme as useNativeColorScheme } from 'react-native';
import { Theme, Colors } from '@/constants/theme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { OpenSans_400Regular, OpenSans_700Bold } from '@expo-google-fonts/open-sans';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const isDark = true;
  const colors = Colors.dark;


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" backgroundColor={Theme.colors.primary} translucent={false} />
        <Stack screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="login" />
          ) : (
            <Stack.Screen name="(tabs)" />
          )}
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
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
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
