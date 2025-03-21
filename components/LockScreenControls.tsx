import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Track, useMusicStore } from '../store/musicStore';
import { formatTime, getPlaceholderArtwork } from '../utils/audioUtils';

/**
 * Composant qui gère les contrôles de lecture sur l'écran verrouillé
 * Ce composant est invisible et s'occupe uniquement de la logique
 */
const LockScreenControls: React.FC = () => {
  const router = useRouter();
  const notificationSubscription = useRef<Notifications.Subscription | null>(null);
  
  const {
    currentTrack,
    isPlaying,
    pauseTrack,
    resumeTrack,
    playNextTrack,
    playPreviousTrack,
  } = useMusicStore();
  
  // Effet pour configurer les notifications et les écouteurs
  useEffect(() => {
    // Set up notification handler for better background behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });
    
    // Définir l'écouteur de réponse aux notifications
    notificationSubscription.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const { actionIdentifier, notification } = response;
      const { data } = notification.request.content;
      
      console.log('Réponse de notification reçue:', actionIdentifier);
      
      // Si l'utilisateur a cliqué sur la notification elle-même (pas sur un bouton)
      if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        const trackId = data.trackId;
        if (trackId) {
          // Naviguer vers les détails de la piste
          router.push(`/track-details?trackId=${trackId}`);
        }
        return;
      }
      
      // Gérer les actions des boutons de notification
      switch (actionIdentifier) {
        case 'play-pause':
          if (data.isPlaying) {
            pauseTrack();
          } else {
            resumeTrack();
          }
          break;
        case 'next':
          playNextTrack();
          break;
        case 'previous':
          playPreviousTrack();
          break;
      }
    });
    
    // Nettoyer l'écouteur lorsque le composant est démonté
    return () => {
      if (notificationSubscription.current) {
        Notifications.removeNotificationSubscription(notificationSubscription.current);
      }
      // Make sure to dismiss all notifications when component unmounts
      Notifications.dismissAllNotificationsAsync();
    };
  }, [router, pauseTrack, resumeTrack, playNextTrack, playPreviousTrack]);
  
  // Effet pour mettre à jour la notification lorsque l'état de lecture change
  useEffect(() => {
    if (!currentTrack) {
      // Dismiss notifications if no track is playing
      Notifications.dismissAllNotificationsAsync();
      return;
    }
    
    // Fonction pour afficher la notification avec les contrôles
    const showPlaybackNotification = async () => {
      try {
        // Create or update notification channels for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('playback', {
            name: 'Playback Controls',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 0, 0, 0], // No vibration
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            sound: null,
          });
        }
        
        // Configure the notification actions
        await Notifications.setNotificationCategoryAsync('playback', [
          {
            identifier: 'previous',
            buttonTitle: '⏮️',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: 'play-pause',
            buttonTitle: isPlaying ? '⏸️' : '▶️',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: 'next',
            buttonTitle: '⏭️',
            options: {
              isDestructive: false,
              isAuthenticationRequired: false,
            },
          },
        ]);
        
        // Préparer l'image pour la notification
        let imageUri = currentTrack.artwork 
          ? currentTrack.artwork 
          : getPlaceholderArtwork(currentTrack.title, currentTrack.artist);
        
        // Supprimer les notifications existantes pour éviter les doublons
        await Notifications.dismissAllNotificationsAsync();
        
        // Configurer les options spécifiques à iOS
        let iosOptions = {};
        if (Platform.OS === 'ios') {
          iosOptions = {
            sound: false,
            // Ces options contrôlent l'apparence sur l'écran de verrouillage iOS
            presentationOptions: ['alert', 'badge'],
          };
        }
        
        // Afficher la notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: currentTrack.title,
            subtitle: currentTrack.artist,
            body: `${currentTrack.album || 'Album inconnu'} • ${formatTime(currentTrack.duration)}`,
            data: { 
              trackId: currentTrack.id, 
              action: 'none',
              isPlaying
            },
            categoryIdentifier: 'playback',
            priority: 'max',
            sticky: true,
            autoDismiss: false,
            badge: 1,
            color: '#FF2D55',
            ...iosOptions,
          },
          trigger: null, // Affichage immédiat
        });
      } catch (error) {
        console.error('Erreur lors de l\'affichage de la notification:', error);
      }
    };
    
    // Show the notification with a slight delay to avoid rapid updates
    const timer = setTimeout(() => {
      showPlaybackNotification();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentTrack, isPlaying]);
  
  // Ce composant ne rend rien visuellement
  return null;
};

export default LockScreenControls; 