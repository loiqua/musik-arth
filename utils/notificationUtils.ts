import { Platform, Image } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Track } from '../store/musicStore';

/**
 * Optimise le titre de la piste pour l'affichage dans une notification
 * @param title Titre original de la piste
 * @param maxLength Longueur maximale du titre (par défaut 40 caractères)
 */
export const formatNotificationTitle = (title: string, maxLength: number = 40): string => {
  if (!title) return 'Titre inconnu';
  if (title.length <= maxLength) return title;
  return `${title.substring(0, maxLength - 3)}...`;
};

/**
 * Prépare le texte des boutons de notification selon la plateforme
 * @param isPlaying État de lecture actuel
 */
export const getNotificationButtonText = (actionType: 'play' | 'pause' | 'next' | 'previous') => {
  // Sur iOS, on utilise des titres courts pour les boutons
  if (Platform.OS === 'ios') {
    switch (actionType) {
      case 'play': return 'Lire';
      case 'pause': return 'Pause';
      case 'next': return 'Suivant';
      case 'previous': return 'Précédent';
    }
  }
  
  // Sur Android, on peut utiliser des titres plus courts car ils sont souvent accompagnés d'icônes
  switch (actionType) {
    case 'play': return 'Lire';
    case 'pause': return 'Pause';
    case 'next': return 'Suivant';
    case 'previous': return 'Préc.';
  }
};

/**
 * Configure les options de notification optimales selon la plateforme
 */
export const configureNotifications = async () => {
  // Configuration du handler de notification
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
  
  // Précharger les images utilisées dans les notifications
  await preloadNotificationImages();
  
  // Configurer le canal de notification pour Android - configuration améliorée
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('playback', {
        name: 'Lecture musicale',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        // Utiliser une couleur d'accent visible
        lightColor: '#FF2D55',
        // Assurer la visibilité sur l'écran de verrouillage
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        // Pas de son pour éviter des interférences avec la musique
        sound: null,
        // Description pour l'utilisateur
        description: 'Contrôles de lecture musicale',
        // Canal de priorité élevée
        showBadge: true,
      });
      
      console.log('Canal de notification configuré avec succès sur Android');
    } catch (error) {
      console.error('Erreur lors de la configuration du canal de notification:', error);
    }
  }
};

/**
 * Construit les options de notification pour une piste
 * @param track Piste actuelle
 * @param isPlaying État de lecture
 */
export const buildNotificationContent = (track: Track, isPlaying: boolean) => {
  // URL de l'icône musicale (même URL que dans audioUtils.ts)
  const musicIcon = 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png';
  
  // Utiliser l'artwork de la piste si disponible, sinon utiliser l'icône 
  const artworkUri = track.artwork || musicIcon;
  
  // Options de base
  const content: Notifications.NotificationContentInput = {
    title: formatNotificationTitle(track.title),
    subtitle: track.artist || 'Artiste inconnu',
    body: track.album || 'Album inconnu',
    data: { 
      track, 
      action: isPlaying ? 'PLAYING' : 'PAUSED',
      // Ajouter l'URL de l'artwork dans les données
      artwork: artworkUri
    },
    priority: 'high',
    categoryIdentifier: 'playback',
    sound: false,
    sticky: true,
    autoDismiss: false,
    color: '#FF2D55',
  };
  
  // Assurer que l'artwork est bien défini
  if (artworkUri) {
    console.log('Ajout de l\'artwork à la notification: ' + artworkUri);
    
    // Sur iOS, utiliser les attachements pour montrer l'image
    if (Platform.OS === 'ios') {
      // @ts-ignore - Les attachements ne sont pas dans le type mais sont supportés sur iOS
      content.attachments = [
        {
          url: artworkUri,
          identifier: 'artwork',
          type: 'image'
        }
      ];
    }
    
    // Sur Android, on peut spécifier des options supplémentaires
    if (Platform.OS === 'android') {
      // @ts-ignore - Ajoutez des propriétés Android-spécifiques
      content.android = {
        channelId: 'playback',
        // Utiliser l'icône par défaut de l'application est plus fiable
        // que d'essayer d'utiliser une URL pour l'icône
        // icon: musicIcon, // Cette approche est souvent problématique sur Android
        color: '#FF2D55',
        vibrationPattern: [0, 250, 250, 250],
        ongoing: true,
        smallIcon: 'ic_notification', // utilisera l'icône par défaut de l'application
      };
    }
  } else {
    console.log('Pas d\'artwork disponible pour la notification');
  }
  
  return content;
};

/**
 * Récupère les actions pour les notifications de lecture
 * @param isPlaying État de lecture actuel
 */
export const getPlaybackActions = (isPlaying: boolean) => [
  {
    identifier: 'PREVIOUS',
    buttonTitle: getNotificationButtonText('previous'),
    options: {
      isDestructive: false,
      isAuthenticationRequired: false,
    },
  },
  {
    identifier: isPlaying ? 'PAUSE' : 'PLAY',
    buttonTitle: getNotificationButtonText(isPlaying ? 'pause' : 'play'),
    options: {
      isDestructive: false,
      isAuthenticationRequired: false,
    },
  },
  {
    identifier: 'NEXT',
    buttonTitle: getNotificationButtonText('next'),
    options: {
      isDestructive: false,
      isAuthenticationRequired: false,
    },
  },
];

/**
 * Précharge une image pour s'assurer qu'elle est disponible pour les notifications
 * @param url URL de l'image à précharger
 */
const preloadImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    // Utiliser Image.prefetch sur Android pour pré-charger les images
    // Cela peut aider à résoudre certains problèmes d'affichage des icônes
    if (Platform.OS === 'android') {
      Image.prefetch(url)
        .then(() => resolve(true))
        .catch((error) => {
          console.error('Erreur de préchargement d\'image:', error);
          resolve(false);
        });
    } else {
      // Sur iOS, pas besoin de précharger
      resolve(true);
    }
  });
};

/**
 * Précharge les images couramment utilisées pour les notifications
 * Cela peut améliorer l'affichage des icônes dans les notifications
 */
export const preloadNotificationImages = async () => {
  if (Platform.OS !== 'android') return;
  
  // URL de l'icône musicale (même URL que dans audioUtils.ts)
  const musicIcon = 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png';
  
  // Précharger l'icône
  try {
    console.log('Préchargement de l\'icône musicale...');
    await preloadImage(musicIcon);
    console.log('Icône musicale préchargée avec succès');
    
    // Sur Android, configurer également quelques options supplémentaires pour les notifications
    await Notifications.setNotificationChannelAsync('playback', {
      name: 'Lecture musicale',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF2D55',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: null,
      description: 'Contrôles de lecture musicale',
      showBadge: true,
    });
    
    console.log('Configuration du canal de notification mise à jour');
  } catch (error) {
    console.error('Erreur lors du préchargement de l\'icône musicale:', error);
  }
}; 