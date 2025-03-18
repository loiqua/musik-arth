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
      body: `${track.album || 'Album unknown'} • ${formatTime(track.duration)}`,
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
  isLocal?: boolean; // Indicates if the file is stored locally
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
let pendingAudioOperations: (() => Promise<any>)[] = [];

// Fonction utilitaire pour exécuter une opération audio en toute sécurité
const safeAudioOperation = async (operation: () => Promise<any>) => {
  if (isAudioOperationInProgress) {
    console.log('Une opération audio est déjà en cours, mise en file d\'attente');
    // Ajouter l'opération à la file d'attente
    pendingAudioOperations.push(operation);
    return;
  }
  
  isAudioOperationInProgress = true;
  try {
    await operation();
  } catch (error) {
    console.error('Erreur lors de l\'opération audio:', error);
  } finally {
    isAudioOperationInProgress = false;
    
    // Vérifier s'il y a des opérations en attente et exécuter la suivante
    if (pendingAudioOperations.length > 0) {
      // Récupérer la prochaine opération en file d'attente
      const nextOperation = pendingAudioOperations.shift();
      if (nextOperation) {
        // Exécution décalée pour éviter les problèmes de pile d'appels
        setTimeout(() => {
          safeAudioOperation(nextOperation);
        }, 50);
      }
    }
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
            
            // Try to extract the artist and title if the format is "Artist - Title"
            let title = rawTitle;
            let artist = 'Unknown Artist';
            let album = 'Unknown Album';
            
            // Check if the filename follows the "Artist - Title" format
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
              duration: asset.duration * 1000 || 0, // Convert to milliseconds
            artwork: null,
          });
        }
      }
      
      // Combine library tracks with local tracks
      // Avoid duplicates based on URI
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
        
        // Si on essaie de jouer la même piste qui est déjà en cours de lecture, ne rien faire
        const { currentTrack: prevTrack, isPlaying } = get();
        if (prevTrack && prevTrack.id === track.id && isPlaying) {
          console.log('Track already playing:', track.title);
          return;
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
        newSound.setOnPlaybackStatusUpdate((status: any) => {
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
        const { tracks, currentTrack, shuffleMode, repeatMode } = get();
        if (!currentTrack || tracks.length === 0) {
          console.log('Aucune piste à jouer.');
          return;
        }
        
        if (tracks.length === 1) {
          // S'il n'y a qu'une seule piste et qu'on est en mode répétition
          if (repeatMode !== 'off') {
            await get().seekTo(0);
            await get().resumeTrack();
            return;
          } else {
            console.log('Une seule piste disponible et le mode répétition est désactivé.');
            return;
          }
        }
        
        let currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1) {
          console.log('Piste actuelle non trouvée dans la liste.');
          // Si la piste actuelle n'est pas trouvée, jouer la première piste
          await get().playTrack(tracks[0]);
          return;
        }
        
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
          
          // Si nous atteignons la fin de la liste et que le mode répétition est désactivé
          if (nextIndex === 0 && repeatMode === 'off') {
            // Si le mode répétition est désactivé, arrêter la lecture à la fin de la liste
            console.log('Fin de la liste de lecture atteinte.');
            await get().seekTo(0);
            await get().pauseTrack();
            return;
          }
        }
        
        // Si mode repeat one, redémarrer la piste actuelle
        if (repeatMode === 'one') {
          await get().seekTo(0);
          await get().resumeTrack();
          return;
        }
        
        const nextTrack = tracks[nextIndex];
        console.log(`Lecture de la piste suivante: ${nextTrack.title}`);
        await get().playTrack(nextTrack);
      } catch (error) {
        console.error('Erreur lors de la lecture de la piste suivante:', error);
      }
    });
  },
  
  playPreviousTrack: async () => {
    await safeAudioOperation(async () => {
      try {
        const { tracks, currentTrack, playbackPosition, shuffleMode } = get();
        if (!currentTrack || tracks.length === 0) {
          console.log('Aucune piste à jouer.');
          return;
        }
        
        // Si la position de lecture est supérieure à 3 secondes, redémarrer la piste actuelle
        if (playbackPosition > 3000) {
          console.log('Redémarrage de la piste actuelle.');
          await get().seekTo(0);
          return;
        }
        
        if (tracks.length === 1) {
          // S'il n'y a qu'une seule piste, simplement la redémarrer
          await get().seekTo(0);
          return;
        }
        
        // Sinon, passer à la piste précédente
        let currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1) {
          console.log('Piste actuelle non trouvée dans la liste.');
          // Si la piste actuelle n'est pas trouvée, jouer la première piste
          await get().playTrack(tracks[0]);
          return;
        }
        
        let prevIndex;
        if (shuffleMode) {
          // En mode shuffle, sélectionner une piste aléatoire (sauf la piste actuelle)
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * tracks.length);
          } while (randomIndex === currentIndex && tracks.length > 1);
          prevIndex = randomIndex;
        } else {
          // Mode normal - revenir à la piste précédente
          prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        }
        
        const prevTrack = tracks[prevIndex];
        console.log(`Lecture de la piste précédente: ${prevTrack.title}`);
        await get().playTrack(prevTrack);
      } catch (error) {
        console.error('Erreur lors de la lecture de la piste précédente:', error);
      }
    });
  },
  
  seekTo: async (position: number) => {
    const { sound } = get();
    if (sound) {
        // Arrondir la position pour éviter des mises à jour trop précises et inutiles
        const roundedPosition = Math.round(position);
        await sound.setPositionAsync(roundedPosition);
        
        // Mettre à jour l'état après que le son ait été positionné
        set({ playbackPosition: roundedPosition });
    }
  },
  
  createPlaylist: (name: string) => {
    // Check if a playlist with this name already exists (case insensitive search)
    const playlistExists = get().playlists.some(
      playlist => playlist.name.toLowerCase() === name.toLowerCase()
    );
    
    // If a playlist with this name already exists, do not create a new playlist
    if (playlistExists) {
      // We could add a notification to the user here if we had a notification system
      console.log('A playlist with this name already exists');
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
    // Check if the track is already in the playlist
    const playlist = get().playlists.find(p => p.id === playlistId);
    
    if (playlist && playlist.tracks.includes(trackId)) {
      // The track is already in the playlist, do nothing
      console.log('The track is already in the playlist');
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
      
      // Select an audio file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        set({ isLoading: false });
        return;
      }
      
      const file = result.assets[0];
      
      // Create a folder to store audio files if necessary
      const audioDir = `${FileSystem.documentDirectory}audio/`;
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      }
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const destUri = `${audioDir}${fileName}`;
      
      // Copy the file into our application folder
      await FileSystem.copyAsync({
        from: file.uri,
        to: destUri,
      });
        
        // Extract the title from the filename by removing the extension
        const rawTitle = file.name.replace(`.${fileExt}`, '');
        
        // Try to extract the artist and title if the format is "Artist - Title"
        let title = rawTitle;
        let artist = 'Unknown Artist';
        let album = 'Unknown Album';
        
        // Check if the filename follows the "Artist - Title" format
        const titleParts = rawTitle.split(' - ');
        if (titleParts.length >= 2) {
          artist = titleParts[0].trim();
          title = titleParts.slice(1).join(' - ').trim();
        }
      
      // Create a new track
      const newTrack: Track = {
        id: `local-${Date.now()}`,
        uri: destUri,
          title: title,
          artist: artist,
          album: album,
        duration: 0, // We'll update the duration after loading the sound
        artwork: null,
        isLocal: true,
      };
      
      // Get the audio file duration
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
      
      // Add the new track to the list
      set(state => {
        const updatedTracks = [...state.tracks, newTrack];
        
        // Save tracks to local storage
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
      
      // Save only local tracks
      const localTracks = tracks.filter(track => track.isLocal);
      
      // Use a rate limiter (debounce) to avoid too frequent saves
      // Temporarily store data to save
      if (get().saveDebounceTimeout) {
        clearTimeout(get().saveDebounceTimeout);
      }
      
      const timeout = setTimeout(async () => {
        // Save local tracks
        await AsyncStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(localTracks));
        
        // Also save playlists
        await AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
        
        console.log('Data saved to storage successfully');
      }, 300); // 300ms delay to group multiple modifications
      
      // Store timeout for possible cancellation
      set({ saveDebounceTimeout: timeout });
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  },
  
  loadTracksFromStorage: async () => {
    try {
      // Load tracks
      const tracksJson = await AsyncStorage.getItem(TRACKS_STORAGE_KEY);
      const localTracks: Track[] = tracksJson ? JSON.parse(tracksJson) : [];
      
      // Load playlists
      const playlistsJson = await AsyncStorage.getItem(PLAYLISTS_STORAGE_KEY);
      const localPlaylists: Playlist[] = playlistsJson ? JSON.parse(playlistsJson) : [];
      
      set(state => {
        // Filter existing tracks to keep only those that are not local
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
      // Mark as loading to avoid interactions during deletion
      set({ isLoading: true });
      
      const { tracks, currentTrack, sound } = get();
      const trackToDelete = tracks.find(t => t.id === trackId);
      
      if (!trackToDelete) {
        set({ isLoading: false });
        return;
      }
      
      // If this is the currently playing track, stop playback
      if (currentTrack?.id === trackId) {
        try {
          // Stop playback before unloading sound
          if (sound) {
            await sound.stopAsync().catch(() => {});
            await sound.unloadAsync().catch(() => {});
          }
          
          // Update state to indicate no track is playing
          set({ 
            currentTrack: null, 
            sound: null,
            isPlaying: false,
            playbackPosition: 0,
            playbackDuration: 0
          });
        } catch (error) {
          console.error('Error stopping playback:', error);
        }
      }
      
      // If this is a local track, delete the file
      if (trackToDelete.isLocal && trackToDelete.uri) {
        try {
          await deleteLocalFileIfNeeded(trackToDelete.uri, true);
        } catch (error) {
          console.error('Error deleting local file:', error);
        }
      }
      
      // Update track and playlist lists
      const updatedTracks = tracks.filter(t => t.id !== trackId);
      
      // Update playlists to remove this track
      const updatedPlaylists = get().playlists.map(playlist => ({
        ...playlist,
        tracks: playlist.tracks.filter(id => id !== trackId)
      }));
      
      // Save changes to storage
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
        console.error('Error saving data to storage:', error);
      }
      
      // Update state with new lists
      set({ 
        tracks: updatedTracks, 
        playlists: updatedPlaylists,
        isLoading: false
      });
      
      console.log('Track deleted successfully:', trackId);
    } catch (error) {
      console.error('General error deleting track:', error);
      set({ isLoading: false });
    }
  },
  
  importOnlineTrack: async (url: string, title: string, artist = 'Unknown Artist', album = 'Unknown Album') => {
    try {
      set({ isLoading: true });
      
      // Check if the URL is valid
      if (!url.startsWith('http')) {
        console.error('Invalid URL');
        set({ isLoading: false });
        return;
      }
      
      // Create a new track
      const newTrack: Track = {
        id: `online-${Date.now()}`,
        uri: url,
        title: title,
        artist: artist,
        album: album,
        duration: 0, // Will be updated after loading
        artwork: null,
        isLocal: false,
      };
      
      // Test if the audio can be loaded
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          newTrack.duration = status.durationMillis || 0;
        }
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error testing audio:', error);
        set({ isLoading: false });
        return;
      }
      
      // Add the track to the list
      set(state => {
        const updatedTracks = [...state.tracks, newTrack];
        return { tracks: updatedTracks, isLoading: false };
      });
      
      console.log('Online track imported successfully');
    } catch (error) {
      console.error('Error importing online track:', error);
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
        // Check if the current state is already the one we want
        const track = state.tracks.find(t => t.id === trackId);
        if (!track) return state; // Do nothing if the track doesn't exist
        
        // Avoid unnecessary updates if the state doesn't change
        const newFavoriteState = !track.isFavorite;
        
        const updatedTracks = state.tracks.map(track =>
          track.id === trackId ? { ...track, isFavorite: newFavoriteState } : track
        );
        
        // Also update the current track if it's the one being modified
        let updatedCurrentTrack = state.currentTrack;
        if (state.currentTrack && state.currentTrack.id === trackId) {
          updatedCurrentTrack = {
            ...state.currentTrack,
            isFavorite: newFavoriteState
          };
        }
        
        // Save local tracks with updated favorite status to storage
        // Use requestAnimationFrame to avoid blocking the main thread
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
    
    // Add a new function to check if a track should be opened from a notification
    checkNotificationNavigation: async () => {
      try {
        const trackId = await AsyncStorage.getItem('notification_track_to_open');
        if (trackId) {
          // Clear the stored ID to avoid reopening the same track multiple times
          await AsyncStorage.removeItem('notification_track_to_open');
          
          // Find the corresponding track
          const track = get().tracks.find(t => t.id === trackId);
          if (track) {
            // Play the track
            await get().playTrack(track);
            
            // Return the track ID so the caller can navigate to the details page
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