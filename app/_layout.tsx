import { useEffect, useMemo, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SvgUri } from 'react-native-svg';
import { useAuth } from '@/hooks/useAuth';
import { Theme } from '@/constants/theme';
import { resyncAllReminderNotifications } from '@/lib/notifications';

// Keep the splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

const FORCE_LOADING_SCREEN = process.env.EXPO_PUBLIC_FORCE_LOADING_SCREEN === 'true';
const DEV_ALIGNMENT =
  process.env.EXPO_PUBLIC_DEV_ALIGNMENT === 'true' || process.env.DEV_ALIGNMENT === 'true';
const BG_RAYS = require('../assets/splash-page/bg-rays.svg');
const TV_BODY = require('../assets/splash-page/v-body.svg');
const TEXT_BG = require('../assets/splash-page/text-bg.svg');
const ICON_CLOSE = require('../assets/splash-page/icon-close.svg');
const ICON_CURSOR = require('../assets/splash-page/icon-cursor.svg');
const ICON_FOLDER = require('../assets/splash-page/icon-folder.svg');
const ICON_WARNING = require('../assets/splash-page/icon-warning.svg');
const IPHONE_PRO = { width: 393, height: 852 };
const IPHONE_PRO_MAX = { width: 430, height: 932 };
let hasShownColdLaunchSplash = false;
const TV_ASPECT = 1.45;
const TEXT_ASPECT = 2.2;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function interpolate(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function computeLayout(screenWidth: number, screenHeight: number) {
  const tvAspect = TV_ASPECT;
  const textAspect = TEXT_ASPECT;
  const deviceT = clamp01((screenHeight - IPHONE_PRO.height) / (IPHONE_PRO_MAX.height - IPHONE_PRO.height));
  const tvWidth = screenWidth * 0.62;
  const tvHeight = tvWidth / tvAspect;
  const tvLeft = (screenWidth - tvWidth) / 2;
  const tvTop = screenHeight * 0.25;

  const textWidth = tvWidth * 0.52;
  const textHeight = textWidth / textAspect;
  const textLeft = tvLeft + tvWidth * 0.24;
  const textTop = tvTop + tvHeight * 0.46;

  return {
    tvLeft,
    tvTop,
    tvWidth,
    tvHeight,
    textLeft,
    textTop,
    textWidth,
    textHeight,
    iconFolderSize: tvWidth * 0.13,
    iconFolderLeft: tvLeft + tvWidth * 0.19,
    iconFolderTop: tvTop + tvHeight * 0.39,
    iconCloseSize: tvWidth * 0.1,
    iconCloseLeft: tvLeft + tvWidth * 0.64,
    iconCloseTop: tvTop + tvHeight * 0.37,
    iconCursorSize: tvWidth * 0.11,
    iconCursorLeft: tvLeft + tvWidth * 0.61,
    iconCursorTop: tvTop + tvHeight * 0.53,
    iconWarningSize: tvWidth * 0.09,
    iconWarningLeft: tvLeft + tvWidth * 0.25,
    iconWarningTop: tvTop + tvHeight * 0.56,
    barTop: tvTop + tvHeight + screenHeight * 0.03,
    deviceT,
  };
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PressStart2P_400Regular,
    ShareTechMono_400Regular,
  });

  const { session, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetUris, setAssetUris] = useState<{
    bg: string;
    tv: string;
    text: string;
    close: string;
    cursor: string;
    folder: string;
    warning: string;
  } | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [animationDone, setAnimationDone] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(false);
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [bootDots, setBootDots] = useState('.');

  const folderRot = useSharedValue(0);
  const closeRot = useSharedValue(0);
  const cursorRot = useSharedValue(0);
  const warnRot = useSharedValue(0);
  const tvScaleY = useSharedValue(0.04);
  const contentOpacity = useSharedValue(0);
  const barOpacity = useSharedValue(0);
  const bottomOpacity = useSharedValue(0);
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const layout = useMemo(() => computeLayout(screenWidth, screenHeight), [screenWidth, screenHeight]);

  useEffect(() => {
    if (!__DEV__) return;
    const pro = computeLayout(IPHONE_PRO.width, IPHONE_PRO.height);
    const proMax = computeLayout(IPHONE_PRO_MAX.width, IPHONE_PRO_MAX.height);
    console.log('[splash-layout-check]', { pro, proMax });
  }, []);

  useEffect(() => {
    const modules = [BG_RAYS, TV_BODY, TEXT_BG, ICON_CLOSE, ICON_CURSOR, ICON_FOLDER, ICON_WARNING] as const;
    Promise.all(modules.map(moduleRef => Asset.fromModule(moduleRef).downloadAsync()))
      .then(loaded => {
        const [bg, tv, text, close, cursor, folder, warning] = loaded;
        setAssetUris({
          bg: bg.localUri ?? bg.uri ?? '',
          tv: tv.localUri ?? tv.uri ?? '',
          text: text.localUri ?? text.uri ?? '',
          close: close.localUri ?? close.uri ?? '',
          cursor: cursor.localUri ?? cursor.uri ?? '',
          folder: folder.localUri ?? folder.uri ?? '',
          warning: warning.localUri ?? warning.uri ?? '',
        });
        setAssetsReady(true);
      })
      .catch(() => setAssetsReady(true));
  }, []);

  // Hide splash once fonts have loaded
  useEffect(() => {
    if ((fontsLoaded || fontError) && assetsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, assetsReady]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      setIsActive(nextState === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!session) return;
    void resyncAllReminderNotifications();
  }, [session?.user?.id]);

  const readyForCustomSplash = (fontsLoaded || !!fontError) && assetsReady;
  const shouldShowSystemLoader = !readyForCustomSplash || authLoading;
  const shouldShowCustomSplash =
    !hasShownColdLaunchSplash && isActive && (FORCE_LOADING_SCREEN || !animationDone);
  const shouldShowLoader = shouldShowSystemLoader || shouldShowCustomSplash;

  useEffect(() => {
    if (!shouldShowCustomSplash) return;
    tvScaleY.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    contentOpacity.value = withDelay(350, withTiming(1, { duration: 200 }));
    bottomOpacity.value = withDelay(1000, withTiming(1, { duration: 220 }));

    const jiggle = (
      sv: ReturnType<typeof useSharedValue<number>>,
      duration: number,
      delay: number
    ) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-1, { duration: Math.round(duration / 3), easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: Math.round(duration / 3), easing: Easing.inOut(Easing.sin) }),
            withTiming(-1, { duration: Math.round(duration / 3), easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        )
      );
    };

    jiggle(folderRot, 750, 550);
    jiggle(closeRot, 680, 670);
    jiggle(cursorRot, 820, 790);
    jiggle(warnRot, 700, 910);

    const typeStart = setTimeout(() => {
      const word = 'ALMANAC';
      let idx = 0;
      const typeId = setInterval(() => {
        idx += 1;
        setTypedText(word.slice(0, idx));
        if (idx >= word.length) {
          clearInterval(typeId);
          setTimeout(() => {
            setCursorVisible(true);
            const blinkId = setInterval(() => setCursorVisible(v => !v), 500);
            blinkIntervalRef.current = blinkId;
          }, 400);
        }
      }, 120);
      typeIntervalRef.current = typeId;
    }, 600);

    const dotsId = setInterval(() => {
      setBootDots(prev => (prev === '.' ? '..' : prev === '..' ? '...' : '.'));
    }, 500);

    const barStart = setTimeout(() => {
      setShowLoadingBar(true);
      barOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });

      const progressId = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 100;
          const jump = 3 + Math.floor(Math.random() * 6);
          const next = Math.min(100, prev + jump);
          if (next === 100) {
            clearInterval(progressId);
            setIsReady(true);
            setTimeout(() => {
              setAnimationDone(true);
              if (!FORCE_LOADING_SCREEN) {
                hasShownColdLaunchSplash = true;
              }
            }, 600);
          }
          return next;
        });
      }, 80);
      progressIntervalRef.current = progressId;
    }, 1200);

    return () => {
      clearInterval(dotsId);
      clearTimeout(typeStart);
      clearTimeout(barStart);
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [shouldShowCustomSplash]);

  useEffect(() => {
    if (shouldShowLoader) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [shouldShowLoader, session, segments, router]);

  const tvStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: tvScaleY.value }] }));
  const contentFade = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const cursorStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cursorRot.value * 4}deg` }, { scale: 1 + Math.abs(cursorRot.value) * 0.08 }],
  }));
  const closeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${closeRot.value * 4}deg` }, { scale: 1 + Math.abs(closeRot.value) * 0.08 }],
  }));
  const folderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${folderRot.value * 4}deg` }, { scale: 1 + Math.abs(folderRot.value) * 0.08 }],
  }));
  const warnStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${warnRot.value * 4}deg` }, { scale: 1 + Math.abs(warnRot.value) * 0.08 }],
  }));
  const barFadeStyle = useAnimatedStyle(() => ({ opacity: barOpacity.value }));
  const bottomFadeStyle = useAnimatedStyle(() => ({ opacity: bottomOpacity.value }));

  if (shouldShowLoader) {
    const segmentCount = 20;
    const filledSegments = Math.round((progress / 100) * segmentCount);
    const borderWidth = screenWidth * 0.004;
    const outlineBlue = DEV_ALIGNMENT ? { borderWidth, borderColor: '#2F6DF6' } : undefined;
    const outlineRed = DEV_ALIGNMENT ? { borderWidth, borderColor: '#EF4444' } : undefined;
    const outlineGreen = DEV_ALIGNMENT ? { borderWidth, borderColor: '#22C55E' } : undefined;
    const outlineYellow = DEV_ALIGNMENT ? { borderWidth, borderColor: '#EAB308' } : undefined;
    return (
      <View style={styles.loading}>
        <StatusBar hidden />
        {assetUris?.bg ? <SvgUri uri={assetUris.bg} style={styles.loadingImage} /> : null}
        {assetUris?.tv ? (
          <Animated.View
            style={[
              styles.tvBody,
              tvStyle,
              {
                left: layout.tvLeft,
                top: layout.tvTop,
                width: layout.tvWidth,
                height: layout.tvHeight,
              },
              outlineBlue,
            ]}
          >
            <SvgUri uri={assetUris.tv} width="100%" height="100%" />
          </Animated.View>
        ) : null}

        <Animated.View
          style={[
            styles.textBox,
            contentFade,
            {
              left: layout.textLeft,
              top: layout.textTop,
              width: layout.textWidth,
              height: layout.textHeight,
            },
            outlineRed,
          ]}
          pointerEvents="none"
        >
          {assetUris?.text ? <SvgUri uri={assetUris.text} width="100%" height="100%" /> : null}
          <View style={styles.scanlineOverlay}>
            {Array.from({ length: 42 }).map((_, i) => (
              <View key={`scan-${i}`} style={[styles.scanline, { height: screenHeight * 0.0012 }]} />
            ))}
          </View>
          <View style={[styles.textWrap, outlineYellow]}>
            <Text
              style={[
                styles.tvText,
                {
                  fontSize: layout.tvWidth * 0.048,
                  top: layout.textHeight * 0.35,
                },
              ]}
            >
              {typedText}
              {cursorVisible ? '|' : ''}
            </Text>
          </View>
        </Animated.View>

        {assetUris?.folder ? (
          <Animated.View
            style={[
              styles.absolute,
              contentFade,
              folderStyle,
              {
                left: layout.iconFolderLeft,
                top: layout.iconFolderTop,
                width: layout.iconFolderSize,
                height: layout.iconFolderSize,
              },
              outlineGreen,
            ]}
          >
            <SvgUri uri={assetUris.folder} width="100%" height="100%" />
          </Animated.View>
        ) : null}
        {assetUris?.close ? (
          <Animated.View
            style={[
              styles.absolute,
              contentFade,
              closeStyle,
              {
                left: layout.iconCloseLeft,
                top: layout.iconCloseTop,
                width: layout.iconCloseSize,
                height: layout.iconCloseSize,
              },
              outlineGreen,
            ]}
          >
            <SvgUri uri={assetUris.close} width="100%" height="100%" />
          </Animated.View>
        ) : null}
        {assetUris?.cursor ? (
          <Animated.View
            style={[
              styles.absolute,
              contentFade,
              cursorStyle,
              {
                left: layout.iconCursorLeft,
                top: layout.iconCursorTop,
                width: layout.iconCursorSize,
                height: layout.iconCursorSize,
              },
              outlineGreen,
            ]}
          >
            <SvgUri uri={assetUris.cursor} width="100%" height="100%" />
          </Animated.View>
        ) : null}
        {assetUris?.warning ? (
          <Animated.View
            style={[
              styles.absolute,
              contentFade,
              warnStyle,
              {
                left: layout.iconWarningLeft,
                top: layout.iconWarningTop,
                width: layout.iconWarningSize,
                height: layout.iconWarningSize,
              },
              outlineGreen,
            ]}
          >
            <SvgUri uri={assetUris.warning} width="100%" height="100%" />
          </Animated.View>
        ) : null}

        {showLoadingBar ? (
          <Animated.View
            style={[styles.loadingBarWrap, barFadeStyle, { top: layout.barTop }]}
            pointerEvents="none"
          >
            <Text style={[styles.loadingLabel, { fontSize: screenHeight * 0.0105 }]}>LOADING SYSTEM...</Text>
            <View style={styles.loadingBarRow}>
              <View
                style={[
                  styles.loadingBar,
                  {
                    height: screenHeight * 0.016,
                    borderWidth: screenWidth * 0.004,
                    paddingHorizontal: screenWidth * 0.006,
                    gap: screenWidth * 0.003,
                  },
                ]}
              >
                {Array.from({ length: segmentCount }).map((_, idx) => (
                  <View
                    key={`seg-${idx}`}
                    style={[
                      styles.segment,
                      idx < filledSegments ? styles.segmentFilled : styles.segmentEmpty,
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.loadingPercent, { width: screenWidth * 0.2, fontSize: screenHeight * 0.0105 }]}>
                {isReady ? 'SYSTEM READY.' : `${Math.round(progress)}%`}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View style={[styles.bottomTextWrap, bottomFadeStyle, { top: screenHeight * 0.88 }]}>
          <Text style={[styles.bootText, { fontSize: screenHeight * 0.0105 }]}>BOOTING SYSTEM{bootDots}</Text>
          <Text style={[styles.modeText, { fontSize: screenHeight * 0.0095 }]}>FORCED PREVIEW MODE</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="categories" options={{ presentation: 'modal', headerShown: false }} />
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
    backgroundColor: '#F5EDD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingImage: {
    ...StyleSheet.absoluteFillObject,
  },
  absolute: {
    position: 'absolute',
  },
  tvBody: {
    position: 'absolute',
    transformOrigin: 'center',
  },
  scanlineOverlay: {
    position: 'absolute',
    justifyContent: 'space-around',
    opacity: 0.07,
    overflow: 'hidden',
  },
  scanline: {
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  textBg: {
    ...StyleSheet.absoluteFillObject,
  },
  textBox: {
    position: 'absolute',
    overflow: 'hidden',
  },
  textWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
  },
  tvText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#E8E0D0',
    fontFamily: Theme.fonts.pixel,
    letterSpacing: 0.6,
  },
  loadingBarWrap: {
    position: 'absolute',
    left: '20%',
    width: '60%',
    alignItems: 'center',
    gap: '2%',
  },
  loadingLabel: {
    color: '#8B7355',
    fontFamily: Theme.fonts.mono,
    letterSpacing: 0.5,
  },
  loadingBarRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '2%',
  },
  loadingBar: {
    flex: 1,
    borderColor: '#8B7355',
    backgroundColor: '#1C1C1C',
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    height: '70%',
  },
  segmentFilled: {
    backgroundColor: '#4A7C59',
  },
  segmentEmpty: {
    backgroundColor: 'transparent',
  },
  loadingPercent: {
    color: '#4A7C59',
    textAlign: 'right',
    fontFamily: Theme.fonts.mono,
  },
  bottomTextWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bootText: {
    color: '#1C1C1C',
    fontFamily: Theme.fonts.pixel,
    letterSpacing: 0.5,
  },
  modeText: {
    color: '#A89F8C',
    fontFamily: Theme.fonts.mono,
    letterSpacing: 0.5,
  },
});
