import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { COLORS } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { useMusicStore } from '../store/musicStore';
import NotificationHandler from '../components/NotificationHandler';

// Configuration des notifications pour l'écran verrouillé
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  
  // Initialiser les notifications et les contrôles audio
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Configurer l'audio pour NE PAS rester actif en arrière-plan
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false, // Désactivé
          interruptionModeIOS: 1,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1,
          playThroughEarpieceAndroid: false,
        });
        
        // Demander les permissions pour les notifications
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permissions de notification non accordées');
        }
        
        // Configurer le canal de notification pour Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Notifications par défaut',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF2D55',
          });
        }
        
        console.log('Configuration audio et notifications terminée');
      } catch (error) {
        console.error('Erreur lors de la configuration:', error);
      }
    };
    
    setupApp();
  }, []);
  
  return (
    <>
      {/* Gestionnaire de notifications standard - pas de contrôles de lecture */}
      <NotificationHandler />
      
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="track-details" options={{ headerShown: false }} />
        <Stack.Screen name="albums" options={{ headerShown: false }} />
        <Stack.Screen name="album-details" options={{ headerShown: false }} />
        <Stack.Screen name="playlist-details" options={{ headerShown: false }} />
        <Stack.Screen name="artist-details" options={{ headerShown: false }} />
        <Stack.Screen name="add-to-playlist" options={{ headerShown: false }} />
      </Stack>
    </>
  );
} 