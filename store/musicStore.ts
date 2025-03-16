import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { create } from 'zustand';
import { deleteLocalFileIfNeeded } from '../utils/fileUtils';

export interface Track {
  id: string;
  uri: string | null;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork: string | null;
  isLocal?: boolean; // Indique si le fichier est stocké localement
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
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  
  // Nouvelles fonctions pour l'importation et la gestion des fichiers
  importAudioFile: () => Promise<void>;
  saveTracksToStorage: () => Promise<void>;
  loadTracksFromStorage: () => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  importOnlineTrack: (url: string, title: string, artist?: string, album?: string) => Promise<void>;
}

// Constantes pour le stockage local
const TRACKS_STORAGE_KEY = 'music_player_tracks';
const PLAYLISTS_STORAGE_KEY = 'music_player_playlists';

export const useMusicStore = create<MusicState>((set, get) => ({
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
      
      // In Expo Go, we might not get actual tracks due to permission limitations
      // So we'll create some mock tracks for testing if needed
      let newTracks: Track[] = [];
      
      if (media.assets.length === 0) {
        // Create mock tracks for testing in Expo Go
        console.log('No tracks found in media library. Using local tracks only.');
      } else {
        // Process actual tracks from media library
        for (const asset of media.assets) {
          const info = await MediaLibrary.getAssetInfoAsync(asset);
          
          newTracks.push({
            id: asset.id,
            uri: info.uri,
            title: info.filename || 'Unknown Title',
            artist: asset.albumId ? 'Unknown Artist' : 'Unknown Artist',
            album: asset.albumId ? 'Unknown Album' : 'Unknown Album',
            duration: asset.duration || 0,
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
    try {
      // Unload previous sound if exists
      const { sound: prevSound } = get();
      if (prevSound) {
        await prevSound.unloadAsync();
      }
      
      // Check if this is a mock track (for Expo Go testing)
      if (track.id.startsWith('mock-')) {
        // For mock tracks, we don't actually play anything
        // but we update the UI state to simulate playback
        console.log('Playing mock track:', track.title);
        
        // Set up a timer to simulate playback progress
        const mockSound = {
          unloadAsync: async () => {},
          playAsync: async () => {},
          pauseAsync: async () => {},
          setPositionAsync: async () => {},
        };
        
        // Update state with mock track
        set({
          currentTrack: track,
          sound: mockSound as any,
          isPlaying: true,
          playbackPosition: 0,
          playbackDuration: track.duration,
        });
        
        // Simulate playback progress
        let position = 0;
        const interval = setInterval(() => {
          if (get().isPlaying && get().currentTrack?.id === track.id) {
            position += 1000; // Increment by 1 second
            if (position <= track.duration) {
              set({ playbackPosition: position });
            } else {
              // "Song" finished playing
              clearInterval(interval);
              get().playNextTrack();
            }
          } else {
            clearInterval(interval);
          }
        }, 1000);
        
        return;
      }
      
      // Create and load new sound for real tracks
      if (!track.uri) {
        console.error('Cannot play track: URI is null');
        return;
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
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
      
      // Configure audio mode for background playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      set({
        currentTrack: track,
        sound,
        isPlaying: true,
      });
    } catch (error) {
      console.error('Error playing track:', error);
    }
  },
  
  pauseTrack: async () => {
    const { sound } = get();
    if (sound) {
      await sound.pauseAsync();
      set({ isPlaying: false });
    }
  },
  
  resumeTrack: async () => {
    const { sound } = get();
    if (sound) {
      await sound.playAsync();
      set({ isPlaying: true });
    }
  },
  
  playNextTrack: async () => {
    const { tracks, currentTrack } = get();
    if (!currentTrack) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < tracks.length - 1) {
      const nextTrack = tracks[currentIndex + 1];
      await get().playTrack(nextTrack);
    }
  },
  
  playPreviousTrack: async () => {
    const { tracks, currentTrack } = get();
    if (!currentTrack) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1];
      await get().playTrack(prevTrack);
    }
  },
  
  seekTo: async (position: number) => {
    const { sound } = get();
    if (sound) {
      await sound.setPositionAsync(position);
      set({ playbackPosition: position });
    }
  },
  
  createPlaylist: (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      createdAt: Date.now(),
    };
    
    set(state => {
      const updatedPlaylists = [...state.playlists, newPlaylist];
      // Sauvegarder les playlists dans le stockage local
      AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updatedPlaylists))
        .catch(err => console.error('Error saving playlists:', err));
      
      return { playlists: updatedPlaylists };
    });
  },
  
  addTrackToPlaylist: (playlistId: string, trackId: string) => {
    set(state => {
      const updatedPlaylists = state.playlists.map(playlist => {
        if (playlist.id === playlistId && !playlist.tracks.includes(trackId)) {
          return {
            ...playlist,
            tracks: [...playlist.tracks, trackId],
          };
        }
        return playlist;
      });
      
      // Sauvegarder les playlists dans le stockage local
      AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updatedPlaylists))
        .catch(err => console.error('Error saving playlists:', err));
      
      return { playlists: updatedPlaylists };
    });
  },
  
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => {
    set(state => {
      const updatedPlaylists = state.playlists.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: playlist.tracks.filter(id => id !== trackId),
          };
        }
        return playlist;
      });
      
      // Sauvegarder les playlists dans le stockage local
      AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updatedPlaylists))
        .catch(err => console.error('Error saving playlists:', err));
      
      return { playlists: updatedPlaylists };
    });
  },
  
  deletePlaylist: (playlistId: string) => {
    set(state => {
      const updatedPlaylists = state.playlists.filter(playlist => playlist.id !== playlistId);
      
      // Sauvegarder les playlists dans le stockage local
      AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updatedPlaylists))
        .catch(err => console.error('Error saving playlists:', err));
      
      return { playlists: updatedPlaylists };
    });
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
      
      // Créer une nouvelle piste
      const newTrack: Track = {
        id: `local-${Date.now()}`,
        uri: destUri,
        title: file.name.replace(`.${fileExt}`, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
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
      const { tracks } = get();
      // Ne sauvegarder que les pistes locales
      const localTracks = tracks.filter(track => track.isLocal);
      await AsyncStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(localTracks));
    } catch (error) {
      console.error('Error saving tracks to storage:', error);
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
    const { tracks, currentTrack } = get();
    const trackToDelete = tracks.find(t => t.id === trackId);
    
    if (!trackToDelete) return;
    
    // Si c'est la piste en cours de lecture, arrêter la lecture
    if (currentTrack?.id === trackId) {
      await get().pauseTrack();
      const { sound } = get();
      if (sound) {
        await sound.unloadAsync();
      }
      set({ currentTrack: null, sound: null });
    }
    
    // Si c'est une piste locale, supprimer le fichier
    await deleteLocalFileIfNeeded(trackToDelete.uri, trackToDelete.isLocal);
    
    // Mettre à jour la liste des pistes
    set(state => {
      const updatedTracks = state.tracks.filter(t => t.id !== trackId);
      
      // Mettre à jour les playlists pour supprimer cette piste
      const updatedPlaylists = state.playlists.map(playlist => ({
        ...playlist,
        tracks: playlist.tracks.filter(id => id !== trackId)
      }));
      
      // Sauvegarder les changements dans le stockage local
      AsyncStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(
        updatedTracks.filter(track => track.isLocal)
      )).catch(err => console.error('Error saving tracks:', err));
      
      AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updatedPlaylists))
        .catch(err => console.error('Error saving playlists:', err));
      
      return { tracks: updatedTracks, playlists: updatedPlaylists };
    });
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
  }
})); 