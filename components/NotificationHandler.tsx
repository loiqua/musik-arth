import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useMusicStore } from '../store/musicStore';
import { configureNotifications } from '../utils/notificationUtils';

/**
 * Composant pour gérer les notifications et les actions associées
 * Ce composant n'affiche rien visuellement, il gère seulement la logique des notifications
 */
export default function NotificationHandler() {
  const router = useRouter();
  const checkNotificationNavigation = useMusicStore(state => state.checkNotificationNavigation);

  // Vérifier si une piste doit être ouverte au démarrage ou quand l'app revient au premier plan
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

    // Configurer le gestionnaire de permissions et apparence des notifications
    const setupNotificationsAndPermissions = async () => {
      // Configuration avancée des notifications avec notre nouvelle fonction utilitaire
      await configureNotifications();
      
      // Demander les permissions si nécessaire
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
      }
      
      console.log('Notification handler initialized with enhanced styling');
    };

    // Exécuter la configuration au démarrage
    setupNotificationsAndPermissions();

    // Nettoyage à la fermeture du composant
    return () => {
      subscription.remove();
    };
  }, [router, checkNotificationNavigation]);

  // Ce composant ne rend rien visuellement
  return null;
} 