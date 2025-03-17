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
    };
  }, [router, pauseTrack, resumeTrack, playNextTrack, playPreviousTrack]);
  
  // Effet pour mettre à jour la notification lorsque l'état de lecture change
  useEffect(() => {
    if (!currentTrack) return;
    
    // Fonction pour afficher la notification avec les contrôles
    const showPlaybackNotification = async () => {
      try {
        // Configurer la catégorie de notification avec les actions
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
        
        // Supprimer les notifications existantes
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
            priority: 'high',
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
    
    // Afficher la notification
    showPlaybackNotification();
    
  }, [currentTrack, isPlaying]);
  
  // Ce composant ne rend rien visuellement
  return null;
};

export default LockScreenControls; 