import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/useAuth';
import { Theme } from '@/constants/theme';
import { resyncAllReminderNotifications } from '@/lib/notifications';

// Keep the splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PressStart2P_400Regular,
    ShareTechMono_400Regular,
  });

  const { session, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Hide splash once fonts have loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Route protection: unauthenticated users go to login
  useEffect(() => {
    if (authLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading, fontsLoaded, segments]);

  useEffect(() => {
    if (!session) return;
    void resyncAllReminderNotifications();
  }, [session?.user?.id]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Theme.colors.ink} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="categories" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
