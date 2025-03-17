import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Track } from '../store/musicStore';
import { formatTime, getPlaceholderArtwork } from './audioUtils';

/**
 * Configuration des notifications pour permettre le contrôle de la lecture depuis l'écran de verrouillage
 */
export const setupLockScreenNotifications = async () => {
  // Configuration du gestionnaire de notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });

  // Demande des permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // Configuration du canal de notification pour Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('playback', {
      name: 'Contrôles de lecture',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 0, 0, 0], // Pas de vibration
      lightColor: '#FF2D55',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // Ignorer le mode "Ne pas déranger"
      sound: null, // Pas de son
    });
  }

  return true;
};

/**
 * Configure les contrôles Audio pour le mode arrière-plan
 */
export const setupAudioForBackground = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    interruptionModeIOS: 1, // DUCK_OTHERS
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeAndroid: 1, // DUCK_OTHERS
    playThroughEarpieceAndroid: false,
  });
};

/**
 * Affiche une notification avec les contrôles de lecture pour l'écran de verrouillage
 */
export const showLockScreenControls = async (
  track: Track, 
  isPlaying: boolean,
  callbacks: {
    onPlayPause: () => void,
    onNext: () => void,
    onPrevious: () => void
  }
) => {
  if (!track) return;
  
  try {
    // Configurer les actions de notification avec des icônes visibles
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
    let imageUri = track.artwork ?? getPlaceholderArtwork(track.title, track.artist);
    
    // Supprimer les notifications existantes
    await Notifications.dismissAllNotificationsAsync();
    
    // Options spécifiques à iOS
    let iosOptions = {};
    if (Platform.OS === 'ios') {
      iosOptions = {
        iosAttachments: { url: imageUri },
        sound: false,
        // Ces options contrôlent l'apparence sur l'écran de verrouillage iOS
        presentationOptions: ['alert', 'badge'],
      };
    }
    
    // Créer le contenu de la notification
    const notificationContent = {
      title: track.title,
      subtitle: track.artist,
      body: `${track.album ?? 'Album inconnu'} • ${formatTime(track.duration)}`,
      data: { 
        trackId: track.id, 
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
    };
    
    // Afficher la notification
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Affichage immédiat
    });
    
    // Configuration spécifique pour Android
    if (Platform.OS === 'android') {
      // Configurer le canal de notification en premier plan
      await Notifications.setNotificationChannelAsync('playback-foreground', {
        name: 'Lecture en cours',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 0, 0, 0],
        lightColor: '#FF2D55',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        sound: null,
        showBadge: true,
      });
      
      // Utiliser MediaSession API pour Android
      setupMediaSession(track, isPlaying, callbacks);
    }
  } catch (error) {
    console.error('Error showing lock screen controls:', error);
  }
};

/**
 * Configure la MediaSession API pour Android
 * Cette API permet d'afficher des contrôles riches dans l'écran de verrouillage Android
 */
const setupMediaSession = async (
  track: Track, 
  isPlaying: boolean,
  callbacks: {
    onPlayPause: () => void,
    onNext: () => void,
    onPrevious: () => void
  }
) => {
  // Vérifier si nous sommes sur Android
  if (Platform.OS !== 'android') {
    return;
  }
  
  try {
    // Utilisation sécurisée de l'API MediaSession
    const audioModule = Audio as any;
    
    if (audioModule.MediaSession) {
      await audioModule.MediaSession.setMetadataAsync({
        title: track.title,
        artist: track.artist,
        album: track.album ?? 'Album inconnu',
        duration: track.duration / 1000, // En secondes
        artwork: track.artwork ?? getPlaceholderArtwork(track.title, track.artist),
      });
      
      // Définir l'état de lecture
      await audioModule.MediaSession.setIsActiveAsync(true);
      
      const playbackState = isPlaying ? 'PLAYING' : 'PAUSED';
      await audioModule.MediaSession.setPlaybackStateAsync(playbackState);
      
      // Configurer les callbacks
      await audioModule.MediaSession.setCallbackAsync('play', () => {
        console.log('Media session play callback');
        if (!isPlaying) {
          callbacks.onPlayPause();
        }
      });
      
      await audioModule.MediaSession.setCallbackAsync('pause', () => {
        console.log('Media session pause callback');
        if (isPlaying) {
          callbacks.onPlayPause();
        }
      });
      
      await audioModule.MediaSession.setCallbackAsync('previoustrack', () => {
        console.log('Media session previous track callback');
        callbacks.onPrevious();
      });
      
      await audioModule.MediaSession.setCallbackAsync('nexttrack', () => {
        console.log('Media session next track callback');
        callbacks.onNext();
      });
      
      await audioModule.MediaSession.setCallbackAsync('stop', () => {
        console.log('Media session stop callback');
        if (isPlaying) {
          callbacks.onPlayPause();
        }
      });
    }
  } catch (error) {
    console.error('Error setting up media session:', error);
  }
};

/**
 * Enregistre un gestionnaire pour traiter les actions de notification
 */
export const setupNotificationActionHandlers = (
  callbacks: {
    onPlayPause: () => void,
    onNext: () => void,
    onPrevious: () => void,
    onOpenTrack: (trackId: string) => void
  }
) => {
  // Ajouter un écouteur pour les réponses aux notifications
  const notificationListener = Notifications.addNotificationResponseReceivedListener((response) => {
    const { actionIdentifier, notification } = response;
    const { data } = notification.request.content;
    
    // Si l'utilisateur a cliqué sur la notification elle-même
    if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      const trackId = data.trackId;
      if (trackId) {
        callbacks.onOpenTrack(trackId);
      }
      return;
    }
    
    // Gérer les actions des boutons
    switch (actionIdentifier) {
      case 'play-pause':
        callbacks.onPlayPause();
        break;
      case 'next':
        callbacks.onNext();
        break;
      case 'previous':
        callbacks.onPrevious();
        break;
    }
  });
  
  // Retourner une fonction pour supprimer l'écouteur
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
  };
}; 