import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, AppState, AppStateStatus, Animated, View, Image } from 'react-native';
import 'react-native-reanimated';
import { useMusicStore } from '../store/musicStore';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../constants/Theme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export default function RootLayout() {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];
  
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });
    
    return () => subscription.remove();
  }, []);
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const requestPermissions = useMusicStore(state => state.requestPermissions);
  const checkNotificationNavigation = useMusicStore(state => state.checkNotificationNavigation);
  
  // Request permissions when the app starts
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Request media permissions
        await requestPermissions();
        
        // Request notification permissions
        await Notifications.requestPermissionsAsync();
        
        // Marquer l'application comme prête
        setAppIsReady(true);
      } catch (e) {
        console.warn(e);
        setAppIsReady(true);
      }
    };
    
    setupApp();
  }, []);
  
  // Vérifier les notifications lorsque l'application est ouverte ou revient au premier plan
  useEffect(() => {
    // Vérifier immédiatement au démarrage
    const checkForNotificationOpen = async () => {
      const trackId = await checkNotificationNavigation();
      if (trackId) {
        // Naviguer vers la page de détails de la piste
        router.push(`/track-details?trackId=${trackId}`);
      }
    };
    
    if (splashAnimationComplete) {
      checkForNotificationOpen();
    }
    
    // Vérifier également lorsque l'application revient au premier plan
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForNotificationOpen();
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [checkNotificationNavigation, router, splashAnimationComplete]);

  // Animer et cacher l'écran de démarrage lorsque l'application est prête
  useEffect(() => {
    if (appIsReady && loaded) {
      // Animer le fondu de l'écran de démarrage
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setSplashAnimationComplete(true);
        SplashScreen.hideAsync();
      });
    }
  }, [appIsReady, loaded, fadeAnim]);

  if (!loaded || !appIsReady || !splashAnimationComplete) {
    return (
      <Animated.View 
        style={{
          flex: 1,
          backgroundColor: COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeAnim,
        }}
      >
        <Image 
          source={require('../assets/images/splash.png')} 
          style={{ width: 300, height: 300, resizeMode: 'contain' }}
        />
      </Animated.View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen 
          name="track-details" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
