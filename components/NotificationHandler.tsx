import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useMusicStore } from '../store/musicStore';
import { configureNotifications } from '../utils/notificationUtils';

/**
 * Composant pour gérer les notifications générales
 * Ce composant n'affiche rien visuellement, il gère seulement la logique des notifications
 */
export default function NotificationHandler() {
  const router = useRouter();
  const checkNotificationNavigation = useMusicStore(state => state.checkNotificationNavigation);

  // Vérifier les notifications au démarrage ou quand l'app revient au premier plan
  useEffect(() => {
    // Fonction pour vérifier les notifications
    const checkNotifications = async () => {
      const trackId = await checkNotificationNavigation();
      if (trackId) {
        // Naviguer vers l'écran des détails de la piste
        router.push(`/track-details?trackId=${trackId}`);
      }
    };

    // Vérifier les notifications au démarrage
    checkNotifications();

    // Vérifier aussi quand l'application revient au premier plan
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkNotifications();
      }
    });

    // Configure notification permissions and appearance
    const setupNotificationsAndPermissions = async () => {
      // Advanced configuration for notifications
      await configureNotifications();
      
      // Request permissions if needed
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            provideAppNotificationSettings: true,
          },
          android: {
            allowSound: true,
          }
        });
        
        console.log(`Notification permissions ${status}`);
      }
      
      // Configure for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF2D55',
        });
      }
      
      console.log('Notification handler initialized');
    };

    // Execute setup at startup
    setupNotificationsAndPermissions();

    // Cleanup when component unmounts
    return () => {
      subscription.remove();
    };
  }, [router, checkNotificationNavigation]);

  // This component doesn't render anything visually
  return null;
} 