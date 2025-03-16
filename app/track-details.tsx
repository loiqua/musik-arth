import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Track, useMusicStore } from '../store/musicStore';
import { formatTime, getPlaceholderArtwork } from '../utils/audioUtils';

export default function TrackDetailsScreen() {
  const router = useRouter();
  const { trackId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    tracks,
    playlists,
    currentTrack,
    playTrack,
    deleteTrack,
  } = useMusicStore();
  
  // Trouver la piste correspondante
  const track = tracks.find(t => t.id === trackId) as Track;
  
  // Si la piste n'existe pas, retourner à l'écran précédent
  if (!track) {
    router.back();
    return null;
  }
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  
  const artworkSource = track.artwork 
    ? { uri: track.artwork } 
    : { uri: getPlaceholderArtwork(track.title, track.artist) };
  
  // Trouver les playlists qui contiennent cette piste
  const trackPlaylists = playlists.filter(playlist => 
    playlist.tracks.includes(track.id)
  );
  
  const handlePlay = () => {
    playTrack(track);
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Supprimer la piste',
      'Êtes-vous sûr de vouloir supprimer cette piste ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteTrack(track.id);
            router.back();
          },
        },
      ]
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={textColor} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          Détails de la piste
        </Text>
        
        <TouchableOpacity style={styles.optionsButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Image source={artworkSource} style={styles.artwork} resizeMode="cover" />
        </View>
        
        {/* Track Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {track.title}
          </Text>
          <Text style={[styles.artist, { color: secondaryTextColor }]}>
            {track.artist}
          </Text>
          <Text style={[styles.album, { color: secondaryTextColor }]}>
            {track.album}
          </Text>
          <Text style={[styles.duration, { color: secondaryTextColor }]}>
            Durée: {formatTime(track.duration)}
          </Text>
          
          {track.isLocal && (
            <Text style={[styles.localBadge, { color: COLORS.primary }]}>
              Fichier local
            </Text>
          )}
        </View>
        
        {/* Play Button */}
        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: COLORS.primary }]}
          onPress={handlePlay}
        >
          <Ionicons 
            name={currentTrack?.id === track.id ? "pause" : "play"} 
            size={32} 
            color="#FFFFFF" 
          />
          <Text style={styles.playButtonText}>
            {currentTrack?.id === track.id ? "Pause" : "Lire"}
          </Text>
        </TouchableOpacity>
        
        {/* Playlists */}
        {trackPlaylists.length > 0 && (
          <View style={styles.playlistsSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Dans les playlists
            </Text>
            
            {trackPlaylists.map(playlist => (
              <View key={playlist.id} style={styles.playlistItem}>
                <Ionicons name="list" size={20} color={secondaryTextColor} />
                <Text style={[styles.playlistName, { color: textColor }]}>
                  {playlist.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    paddingTop: 50, // Pour le status bar
    paddingBottom: SPACING.medium,
  },
  backButton: {
    padding: SPACING.small,
  },
  headerTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.large,
    flex: 1,
    textAlign: 'center',
  },
  optionsButton: {
    padding: SPACING.small,
  },
  content: {
    padding: SPACING.large,
    alignItems: 'center',
  },
  artworkContainer: {
    marginBottom: SPACING.large,
  },
  artwork: {
    width: 250,
    height: 250,
    borderRadius: LAYOUT.borderRadius.medium,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xxl,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  artist: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  album: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  duration: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  localBadge: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.small,
    marginTop: SPACING.small,
    textAlign: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: LAYOUT.borderRadius.medium,
    marginBottom: SPACING.large,
  },
  playButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
    marginLeft: SPACING.small,
  },
  playlistsSection: {
    width: '100%',
    marginTop: SPACING.large,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.medium,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.small,
  },
  playlistName: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginLeft: SPACING.small,
  },
}); 