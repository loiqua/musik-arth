import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { deleteLocalFileIfNeeded } from '../utils/fileUtils';
import { formatTime, getPlaceholderArtwork } from '../utils/audioUtils';

// Configure notifications for background playback
const setupNotifications = async () => {
  // Set up notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
  }

  // Set foreground presentation options
  await Notifications.setNotificationChannelAsync('playback', {
    name: 'Playback',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF2D55',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    sound: 'default',
  });
};

// Call this function when the app starts
setupNotifications();

// Configure audio mode for background playback
const setupAudioMode = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    interruptionModeIOS: 1, // INTERRUPTION_MODE_IOS_DUCK_OTHERS
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeAndroid: 1, // INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
    playThroughEarpieceAndroid: false,
  });
};

// Call this function when the app starts
setupAudioMode();

// Function to stop all playback and clean up resources
const stopAllPlayback = async (sound: Audio.Sound | null) => {
  if (sound) {
    try {
      await sound.pauseAsync();
      await sound.unloadAsync();
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  }
  // Dismiss any notifications
  await Notifications.dismissAllNotificationsAsync();
};

// Function to show playback notification
const showPlaybackNotification = async (track: Track, isPlaying: boolean) => {
  if (!track) return;
  
  try {
    // Configurer les actions de notification avec des icônes plus visibles
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
    let imageUri = null;
    if (track.artwork) {
      imageUri = track.artwork;
    } else {
      // Utiliser une image par défaut si aucune pochette n'est disponible
      imageUri = getPlaceholderArtwork(track.title, track.artist);
    }
    
    // Supprimer les notifications existantes
    await Notifications.dismissAllNotificationsAsync();
    
    // Créer un contenu de notification plus riche
    const notificationContent = {
      title: track.title,
      subtitle: track.artist,
      body: `${track.album || 'Album inconnu'} • ${formatTime(track.duration)}`,
      data: { 
        trackId: track.id, 
        action: 'none',
        isPlaying: isPlaying
      },
      categoryIdentifier: 'playback',
      priority: 'max',
      sticky: true,
      autoDismiss: false,
      badge: 1,
      color: '#FF2D55',
    };
    
    // Programmer la notification avec plus d'informations et un style amélioré
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });
    
    // Pour Android, créer une notification persistante avec style amélioré
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('playback-foreground', {
        name: 'Lecture en cours',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 0, 0, 0],
        lightColor: '#FF2D55',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        sound: null,
      });
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

export interface Track {
  id: string;
  uri: string | null;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork: string | null;
  isLocal?: boolean; // Indique si le fichier est stocké localement
  isFavorite?: boolean; // Track if song is favorite
}

export interface Playlist {
  id: string;
  name: string;
  tracks: string[]; // Array of track IDs
  createdAt: number;
}

interface MusicState {
  // Library
  tracks: Track[];
  playlists: Playlist[];
  isLoading: boolean;
  hasPermission: boolean;
  
  // Player
  currentTrack: Track | null;
  isPlaying: boolean;
  playbackPosition: number;
  playbackDuration: number;
  sound: Audio.Sound | null;
  
  // Playback modes
  shuffleMode: boolean;
  repeatMode: 'off' | 'all' | 'one';
  
  // Système
  saveDebounceTimeout?: NodeJS.Timeout;
  
  // Actions
  loadTracks: () => Promise<void>;
  requestPermissions: () => Promise<void>;
  playTrack: (track: Track) => Promise<void>;
  pauseTrack: () => Promise<void>;
  resumeTrack: () => Promise<void>;
  playNextTrack: () => Promise<void>;
  playPreviousTrack: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  createPlaylist: (name: string) => void;
  renamePlaylist: (playlistId: string, newName: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  
  // Nouvelles fonctions pour l'importation et la gestion des fichiers
  importAudioFile: () => Promise<void>;
  saveTracksToStorage: () => Promise<void>;
  loadTracksFromStorage: () => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  importOnlineTrack: (url: string, title: string, artist?: string, album?: string) => Promise<void>;
  
  // Playback mode functions
  toggleShuffleMode: () => void;
  toggleRepeatMode: () => void;
  
  // Favorites
  toggleFavorite: (trackId: string) => void;
  getFavoriteTracks: () => Track[];
  
  // Ajouter une nouvelle fonction pour vérifier si une piste doit être ouverte depuis une notification
  checkNotificationNavigation: () => Promise<string | null>;
  
  // Cleanup function for app termination
  cleanup: () => Promise<void>;
}

// Constantes pour le stockage local
const TRACKS_STORAGE_KEY = 'music_player_tracks';
const PLAYLISTS_STORAGE_KEY = 'music_player_playlists';

// Ajouter un verrou pour éviter les opérations simultanées sur le même son
let isAudioOperationInProgress = false;

// Fonction utilitaire pour exécuter une opération audio en toute sécurité
const safeAudioOperation = async (operation: () => Promise<any>) => {
  if (isAudioOperationInProgress) {
    console.log('Une opération audio est déjà en cours, ignorée');
    return;
  }
  
  isAudioOperationInProgress = true;
  try {
    await operation();
  } catch (error) {
    console.error('Erreur lors de l\'opération audio:', error);
  } finally {
    isAudioOperationInProgress = false;
  }
};

export const useMusicStore = create<MusicState>((set, get) => {
  // Configurer le gestionnaire de notifications pour répondre aux actions
  Notifications.addNotificationResponseReceivedListener((response) => {
    const { actionIdentifier, notification } = response;
    const { data } = notification.request.content;
    
    // Si l'utilisateur a cliqué sur la notification elle-même (pas sur un bouton d'action)
    if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      // Ouvrir les détails de la piste
      const trackId = data.trackId;
      if (trackId) {
        // Utiliser expo-router pour naviguer vers la page de détails
        // Nous ne pouvons pas utiliser router.push directement ici car nous sommes en dehors du contexte React
        // Nous allons donc stocker l'ID de la piste à ouvrir et le récupérer au prochain rendu
        AsyncStorage.setItem('notification_track_to_open', trackId)
          .catch(err => console.error('Error saving track to open:', err));
      }
      return;
    }
    
    // Gérer les actions des boutons de notification
    if (actionIdentifier === 'play-pause') {
      if (data.isPlaying) {
        get().pauseTrack();
      } else {
        get().resumeTrack();
      }
    } else if (actionIdentifier === 'next') {
      get().playNextTrack();
    } else if (actionIdentifier === 'previous') {
      get().playPreviousTrack();
    }
  });
  
  return {
  // Library
  tracks: [],
  playlists: [],
  isLoading: false,
  hasPermission: false,
  
  // Player
  currentTrack: null,
  isPlaying: false,
  playbackPosition: 0,
  playbackDuration: 0,
  sound: null,
    
    // Playback modes
    shuffleMode: false,
    repeatMode: 'off',
  
  // Actions
  requestPermissions: async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      set({ hasPermission: status === 'granted' });
      
      if (status === 'granted') {
        await get().loadTracks();
      } else {
        // Si les permissions ne sont pas accordées, charger depuis le stockage local
        await get().loadTracksFromStorage();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // En cas d'erreur, essayer de charger depuis le stockage local
      await get().loadTracksFromStorage();
    }
  },
  
  loadTracks: async () => {
    try {
      set({ isLoading: true });
      
      // Charger d'abord les pistes stockées localement
      await get().loadTracksFromStorage();
      
      // Ensuite, essayer de charger depuis la bibliothèque média si les permissions sont accordées
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        set({ isLoading: false });
        return;
      }
      
      // Get all audio files from the media library
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 2000, // Limit to 2000 tracks for performance
      });
      

      let newTracks: Track[] = [];
      
      if (media.assets.length === 0) {
        // Create mock tracks for testing in Expo Go
        console.log('No tracks found in media library. Using local tracks only.');
      } else {
        // Process actual tracks from media library
        for (const asset of media.assets) {
          const info = await MediaLibrary.getAssetInfoAsync(asset);
            
            // Extraire le titre du nom de fichier en supprimant l'extension
            const filename = info.filename || 'Unknown Title';
            const fileExt = filename.split('.').pop();
            const rawTitle = filename.replace(`.${fileExt}`, '');
            
            // Essayer d'extraire l'artiste et le titre si le format est "Artiste - Titre"
            let title = rawTitle;
            let artist = 'Artiste inconnu';
            let album = 'Album inconnu';
            
            // Vérifier si le nom du fichier suit le format "Artiste - Titre"
            const titleParts = rawTitle.split(' - ');
            if (titleParts.length >= 2) {
              artist = titleParts[0].trim();
              title = titleParts.slice(1).join(' - ').trim();
            }
            
            // Utiliser les métadonnées de l'asset si disponibles
            if (asset.albumId) {
              try {
                const albumInfo = await MediaLibrary.getAlbumAsync(asset.albumId);
                if (albumInfo) {
                  album = albumInfo.title || album;
                }
              } catch (error) {
                console.log('Error getting album info:', error);
              }
            }
          
          newTracks.push({
            id: asset.id,
            uri: info.uri,
              title: title,
              artist: artist,
              album: album,
              duration: asset.duration * 1000 || 0, // Convertir en millisecondes
            artwork: null,
          });
        }
      }
      
      // Combiner les pistes de la bibliothèque avec les pistes locales
      // en évitant les doublons (basés sur l'URI)
      const { tracks: localTracks } = get();
      const existingUris = new Set(localTracks.map(track => track.uri));
      
      const combinedTracks = [
        ...localTracks,
        ...newTracks.filter(track => !existingUris.has(track.uri))
      ];
      
      set({ tracks: combinedTracks, isLoading: false });
    } catch (error) {
      console.error('Error loading tracks:', error);
      set({ isLoading: false });
    }
  },
  
  playTrack: async (track: Track) => {
    await safeAudioOperation(async () => {
      try {
        // Arrêter la lecture en cours s'il y a une piste en lecture
        const { sound: currentSound } = get();
        if (currentSound) {
          await currentSound.stopAsync();
          await currentSound.unloadAsync();
        }
        
        // Créer un nouvel objet son
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.uri || '' },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              set({
                playbackPosition: status.positionMillis,
                playbackDuration: status.durationMillis || 0,
                isPlaying: status.isPlaying,
              });
            }
          }
        );
        
        // Enregistrer le son et la piste en cours
        set({
          sound: newSound,
          currentTrack: track,
          isPlaying: true,
          playbackPosition: 0,
          playbackDuration: track.duration,
        });
        
        // Configurer le comportement à la fin de la lecture
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            get().playNextTrack();
          }
        });
        
        // Mettre à jour la notification
        showPlaybackNotification(track, true);
      } catch (error) {
        console.error('Error playing track:', error);
      }
    });
  },
  
  pauseTrack: async () => {
    await safeAudioOperation(async () => {
      try {
        const { sound, currentTrack } = get();
        if (sound) {
          await sound.pauseAsync();
          // Update notification to show paused state
          if (currentTrack) {
            showPlaybackNotification(currentTrack, false);
          }
          set({ isPlaying: false });
        }
      } catch (error) {
        console.error('Error pausing track:', error);
      }
    });
  },
  
  resumeTrack: async () => {
    await safeAudioOperation(async () => {
      try {
        const { sound, currentTrack } = get();
        if (sound) {
          await sound.playAsync();
          
          // Update notification to show playing state
          if (currentTrack) {
            showPlaybackNotification(currentTrack, true);
          }
          
          set({ isPlaying: true });
        }
      } catch (error) {
        console.error('Error resuming track:', error);
      }
    });
  },
  
  playNextTrack: async () => {
    await safeAudioOperation(async () => {
      try {
        const { tracks, currentTrack, shuffleMode } = get();
        if (!currentTrack || tracks.length === 0) return;
        
        let currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1) return;
        
        let nextIndex;
        if (shuffleMode) {
          // Mode aléatoire - choisir une piste au hasard (sauf la piste actuelle)
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * tracks.length);
          } while (randomIndex === currentIndex && tracks.length > 1);
          nextIndex = randomIndex;
        } else {
          // Mode normal - passer à la piste suivante
          nextIndex = (currentIndex + 1) % tracks.length;
        }
        
        const nextTrack = tracks[nextIndex];
        await get().playTrack(nextTrack);
      } catch (error) {
        console.error('Error playing next track:', error);
      }
    });
  },
  
  playPreviousTrack: async () => {
    await safeAudioOperation(async () => {
      try {
        const { tracks, currentTrack, playbackPosition } = get();
        if (!currentTrack || tracks.length === 0) return;
        
        // Si la position de lecture est supérieure à 3 secondes, redémarrer la piste actuelle
        if (playbackPosition > 3000) {
          await get().seekTo(0);
          return;
        }
        
        // Sinon, passer à la piste précédente
        let currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1) return;
        
        let prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        const prevTrack = tracks[prevIndex];
        
        await get().playTrack(prevTrack);
      } catch (error) {
        console.error('Error playing previous track:', error);
      }
    });
  },
  
  seekTo: async (position: number) => {
    await safeAudioOperation(async () => {
      try {
        const { sound } = get();
        if (sound) {
          await sound.setPositionAsync(position);
          set({ playbackPosition: position });
        }
      } catch (error) {
        console.error('Error seeking:', error);
      }
    });
  },
  
  createPlaylist: (name: string) => {
    // Vérifier si une playlist avec ce nom existe déjà (recherche insensible à la casse)
    const playlistExists = get().playlists.some(
      playlist => playlist.name.toLowerCase() === name.toLowerCase()
    );
    
    // Si une playlist avec ce nom existe déjà, ne pas créer de nouvelle playlist
    if (playlistExists) {
      // On pourrait ajouter une notification à l'utilisateur ici si on avait un système de notification
      console.log('Une playlist avec ce nom existe déjà');
      return;
    }
    
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      createdAt: Date.now(),
    };
    
    set(state => ({
      playlists: [...state.playlists, newPlaylist],
    }));
    
    // Save playlists to storage
    get().saveTracksToStorage();
  },
  
  renamePlaylist: (playlistId: string, newName: string) => {
    set(state => ({
      playlists: state.playlists.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, name: newName } 
          : playlist
      ),
    }));
    
    // Save playlists to storage
    get().saveTracksToStorage();
  },
  
  addTrackToPlaylist: (playlistId: string, trackId: string) => {
    // Vérifier si la piste est déjà dans la playlist
    const playlist = get().playlists.find(p => p.id === playlistId);
    
    if (playlist && playlist.tracks.includes(trackId)) {
      // La piste est déjà dans la playlist, ne rien faire
      console.log('La piste est déjà dans la playlist');
      return;
    }
    
    set(state => ({
      playlists: state.playlists.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, tracks: [...playlist.tracks, trackId] } 
          : playlist
      ),
    }));
    
    // Save playlists to storage
    get().saveTracksToStorage();
  },
  
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => {
    set(state => ({
      playlists: state.playlists.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, tracks: playlist.tracks.filter(id => id !== trackId) } 
          : playlist
      ),
    }));
    
    // Save playlists to storage
    get().saveTracksToStorage();
  },
  
  deletePlaylist: (playlistId: string) => {
    set(state => ({
      playlists: state.playlists.filter(playlist => playlist.id !== playlistId),
    }));
    
    // Save playlists to storage
    get().saveTracksToStorage();
  },
  
  // Nouvelles fonctions pour l'importation et la gestion des fichiers
  importAudioFile: async () => {
    try {
      set({ isLoading: true });
      
      // Sélectionner un fichier audio
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        set({ isLoading: false });
        return;
      }
      
      const file = result.assets[0];
      
      // Créer un dossier pour stocker les fichiers audio si nécessaire
      const audioDir = `${FileSystem.documentDirectory}audio/`;
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      }
      
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const destUri = `${audioDir}${fileName}`;
      
      // Copier le fichier dans notre dossier d'application
      await FileSystem.copyAsync({
        from: file.uri,
        to: destUri,
      });
        
        // Extraire le titre du nom de fichier en supprimant l'extension
        const rawTitle = file.name.replace(`.${fileExt}`, '');
        
        // Essayer d'extraire l'artiste et le titre si le format est "Artiste - Titre"
        let title = rawTitle;
        let artist = 'Artiste inconnu';
        let album = 'Album inconnu';
        
        // Vérifier si le nom du fichier suit le format "Artiste - Titre"
        const titleParts = rawTitle.split(' - ');
        if (titleParts.length >= 2) {
          artist = titleParts[0].trim();
          title = titleParts.slice(1).join(' - ').trim();
        }
      
      // Créer une nouvelle piste
      const newTrack: Track = {
        id: `local-${Date.now()}`,
        uri: destUri,
          title: title,
          artist: artist,
          album: album,
        duration: 0, // Nous mettrons à jour la durée après avoir chargé le son
        artwork: null,
        isLocal: true,
      };
      
      // Obtenir la durée du fichier audio
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: destUri });
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          newTrack.duration = status.durationMillis || 0;
        }
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error getting audio duration:', error);
      }
      
      // Ajouter la nouvelle piste à la liste
      set(state => {
        const updatedTracks = [...state.tracks, newTrack];
        
        // Sauvegarder les pistes dans le stockage local
        AsyncStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(
          updatedTracks.filter(track => track.isLocal)
        )).catch(err => console.error('Error saving tracks:', err));
        
        return { tracks: updatedTracks, isLoading: false };
      });
      
      console.log('Audio file imported successfully');
    } catch (error) {
      console.error('Error importing audio file:', error);
      set({ isLoading: false });
    }
  },
  
  saveTracksToStorage: async () => {
    try {
      const { tracks, playlists } = get();
      
      // Ne sauvegarder que les pistes locales
      const localTracks = tracks.filter(track => track.isLocal);
      
      // Utilisons un taux limiteur (debounce) pour éviter des sauvegardes trop fréquentes
      // Stocker temporairement les données à sauvegarder
      if (get().saveDebounceTimeout) {
        clearTimeout(get().saveDebounceTimeout);
      }
      
      const timeout = setTimeout(async () => {
        // Sauvegarder les pistes locales
        await AsyncStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(localTracks));
        
        // Sauvegarder également les playlists
        await AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
        
        console.log('Data saved to storage successfully');
      }, 300); // Délai de 300ms pour regrouper les modifications multiples
      
      // Stocker le timeout pour pouvoir l'annuler si nécessaire
      set({ saveDebounceTimeout: timeout });
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  },
  
  loadTracksFromStorage: async () => {
    try {
      // Charger les pistes
      const tracksJson = await AsyncStorage.getItem(TRACKS_STORAGE_KEY);
      const localTracks: Track[] = tracksJson ? JSON.parse(tracksJson) : [];
      
      // Charger les playlists
      const playlistsJson = await AsyncStorage.getItem(PLAYLISTS_STORAGE_KEY);
      const localPlaylists: Playlist[] = playlistsJson ? JSON.parse(playlistsJson) : [];
      
      set(state => {
        // Filtrer les pistes existantes pour ne garder que celles qui ne sont pas locales
        const nonLocalTracks = state.tracks.filter(track => !track.isLocal);
        
        return {
          tracks: [...nonLocalTracks, ...localTracks],
          playlists: localPlaylists.length > 0 ? localPlaylists : state.playlists
        };
      });
      
      console.log('Loaded tracks and playlists from storage');
    } catch (error) {
      console.error('Error loading tracks from storage:', error);
    }
  },
  
  deleteTrack: async (trackId: string) => {
    try {
      // Marquer comme chargement pour éviter les interactions pendant la suppression
      set({ isLoading: true });
      
      const { tracks, currentTrack, sound } = get();
      const trackToDelete = tracks.find(t => t.id === trackId);
      
      if (!trackToDelete) {
        set({ isLoading: false });
        return;
      }
      
      // Si c'est la piste en cours de lecture, arrêter la lecture
      if (currentTrack?.id === trackId) {
        try {
          // Arrêter la lecture avant de décharger le son
          if (sound) {
            await sound.stopAsync().catch(() => {});
            await sound.unloadAsync().catch(() => {});
          }
          
          // Mettre à jour l'état pour indiquer qu'aucune piste n'est en cours de lecture
          set({ 
            currentTrack: null, 
            sound: null,
            isPlaying: false,
            playbackPosition: 0,
            playbackDuration: 0
          });
        } catch (error) {
          console.error('Erreur lors de l\'arrêt de la lecture:', error);
        }
      }
      
      // Si c'est une piste locale, supprimer le fichier
      if (trackToDelete.isLocal && trackToDelete.uri) {
        try {
          await deleteLocalFileIfNeeded(trackToDelete.uri, true);
        } catch (error) {
          console.error('Erreur lors de la suppression du fichier local:', error);
        }
      }
      
      // Mettre à jour la liste des pistes et des playlists
      const updatedTracks = tracks.filter(t => t.id !== trackId);
      
      // Mettre à jour les playlists pour supprimer cette piste
      const updatedPlaylists = get().playlists.map(playlist => ({
        ...playlist,
        tracks: playlist.tracks.filter(id => id !== trackId)
      }));
      
      // Sauvegarder les changements dans le stockage local
      try {
        await AsyncStorage.setItem(
          TRACKS_STORAGE_KEY, 
          JSON.stringify(updatedTracks.filter(track => track.isLocal))
        );
        
        await AsyncStorage.setItem(
          PLAYLISTS_STORAGE_KEY, 
          JSON.stringify(updatedPlaylists)
        );
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
      }
      
      // Mettre à jour l'état avec les nouvelles listes
      set({ 
        tracks: updatedTracks, 
        playlists: updatedPlaylists,
        isLoading: false
      });
      
      console.log('Piste supprimée avec succès:', trackId);
    } catch (error) {
      console.error('Erreur globale lors de la suppression de la piste:', error);
      set({ isLoading: false });
    }
  },
  
  importOnlineTrack: async (url: string, title: string, artist = 'Artiste inconnu', album = 'Album inconnu') => {
    try {
      set({ isLoading: true });
      
      // Vérifier si l'URL est valide
      if (!url.startsWith('http')) {
        console.error('URL invalide');
        set({ isLoading: false });
        return;
      }
      
      // Créer une nouvelle piste
      const newTrack: Track = {
        id: `online-${Date.now()}`,
        uri: url,
        title: title,
        artist: artist,
        album: album,
        duration: 0, // Sera mis à jour après chargement
        artwork: null,
        isLocal: false,
      };
      
      // Tester si l'audio peut être chargé
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          newTrack.duration = status.durationMillis || 0;
        }
        await sound.unloadAsync();
      } catch (error) {
        console.error('Erreur lors du test de l\'audio:', error);
        set({ isLoading: false });
        return;
      }
      
      // Ajouter la piste à la liste
      set(state => {
        const updatedTracks = [...state.tracks, newTrack];
        return { tracks: updatedTracks, isLoading: false };
      });
      
      console.log('Piste en ligne importée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'importation de la piste en ligne:', error);
      set({ isLoading: false });
    }
    },
    
    // Playback mode functions
    toggleShuffleMode: () => {
      set(state => ({ shuffleMode: !state.shuffleMode }));
    },
    
    toggleRepeatMode: () => {
      set(state => ({
        repeatMode: state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off'
      }));
    },
    
    // Favorites
    toggleFavorite: (trackId: string) => {
      set(state => {
        // Vérifier si l'état actuel est déjà celui que nous voulons
        const track = state.tracks.find(t => t.id === trackId);
        if (!track) return state; // Ne rien faire si la piste n'existe pas
        
        // Éviter les mises à jour inutiles si l'état ne change pas
        const newFavoriteState = !track.isFavorite;
        
        const updatedTracks = state.tracks.map(track =>
          track.id === trackId ? { ...track, isFavorite: newFavoriteState } : track
        );
        
        // Mettre à jour également la piste courante si c'est celle qui est modifiée
        let updatedCurrentTrack = state.currentTrack;
        if (state.currentTrack && state.currentTrack.id === trackId) {
          updatedCurrentTrack = {
            ...state.currentTrack,
            isFavorite: newFavoriteState
          };
        }
        
        // Save local tracks with updated favorite status to storage
        // Utiliser requestAnimationFrame pour éviter de bloquer le thread principal
        requestAnimationFrame(() => {
          AsyncStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(
            updatedTracks.filter(track => track.isLocal)
          )).catch(err => console.error('Error saving tracks with favorites:', err));
        });
        
        return { 
          tracks: updatedTracks,
          currentTrack: updatedCurrentTrack
        };
      });
    },
    
    getFavoriteTracks: () => {
      return get().tracks.filter(track => track.isFavorite);
    },
    
    // Ajouter une nouvelle fonction pour vérifier si une piste doit être ouverte depuis une notification
    checkNotificationNavigation: async () => {
      try {
        const trackId = await AsyncStorage.getItem('notification_track_to_open');
        if (trackId) {
          // Effacer l'ID stocké pour éviter de rouvrir la même piste plusieurs fois
          await AsyncStorage.removeItem('notification_track_to_open');
          
          // Trouver la piste correspondante
          const track = get().tracks.find(t => t.id === trackId);
          if (track) {
            // Jouer la piste
            await get().playTrack(track);
            
            // Retourner l'ID de la piste pour que l'appelant puisse naviguer vers la page de détails
            return trackId;
          }
        }
        return null;
      } catch (error) {
        console.error('Error checking notification navigation:', error);
        return null;
      }
    },

    // Cleanup function for app termination
    cleanup: async () => {
      await safeAudioOperation(async () => {
        try {
          const { sound } = get();
          if (sound) {
            console.log('Cleaning up audio resources...');
            
            // Arrêter d'abord la lecture
            await sound.stopAsync().catch(e => console.warn('Error stopping sound:', e));
            
            // Ensuite décharger le son
            await sound.unloadAsync().catch(e => console.warn('Error unloading sound:', e));
            
            // Réinitialiser l'état
            set({
              sound: null,
              isPlaying: false,
              playbackPosition: 0,
            });
            
            console.log('Audio resources cleaned up successfully');
          }
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      });
    }
  };
}); 