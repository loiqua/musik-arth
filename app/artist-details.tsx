import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import MiniPlayer from '../components/MiniPlayer';
import TrackItem from '../components/TrackItem';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Track, useMusicStore } from '../store/musicStore';
import { getArtistPlaceholderArtwork } from '../utils/audioUtils';
import * as Haptics from 'expo-haptics';

export default function ArtistDetailsScreen() {
  const { artistName } = useLocalSearchParams<{ artistName: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { tracks, currentTrack, playTrack, isLoading } = useMusicStore();
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  // Filtrer les pistes par artiste
  const artistTracks = useMemo(() => {
    return tracks.filter(track => track.artist === artistName);
  }, [tracks, artistName]);
  
  // Fonction pour revenir en arrière
  const handleBackPress = () => {
    router.back();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Fonction pour lire les pistes en mode aléatoire
  const handleShufflePlay = () => {
    if (artistTracks.length > 0) {
      // Sélectionner une piste aléatoire
      const randomIndex = Math.floor(Math.random() * artistTracks.length);
      playTrack(artistTracks[randomIndex]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };
  
  // Organiser les pistes par album
  const albumsMap = useMemo(() => {
    const albums = new Map<string, Track[]>();
    
    artistTracks.forEach(track => {
      const albumName = track.album || 'Unknown Album';
      
      if (!albums.has(albumName)) {
        albums.set(albumName, []);
      }
      
      albums.get(albumName)!.push(track);
    });
    
    return albums;
  }, [artistTracks]);
  
  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };
  
  // Trouver une image d'artiste (utiliser la première piste avec artwork)
  const artistImage = useMemo(() => {
    const trackWithArtwork = artistTracks.find(track => track.artwork);
    return trackWithArtwork?.artwork || getArtistPlaceholderArtwork(artistName as string);
  }, [artistTracks, artistName]);
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AppHeader 
          title="Artiste" 
          showBackButton 
          onBackPress={handleBackPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader 
        title="Artiste" 
        showBackButton 
        onBackPress={handleBackPress}
        rightComponent={
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={Array.from(albumsMap.entries())}
        keyExtractor={([albumName]) => albumName}
        ListHeaderComponent={() => (
          <View style={styles.artistHeader}>
            <View style={styles.artistImageContainer}>
              <Image 
                source={{ uri: artistImage }} 
                style={styles.artistImage} 
                resizeMode="cover"
              />
              <View style={styles.artistImageOverlay} />
            </View>
            
            <Text style={[styles.artistName, { color: textColor }]}>
              {artistName}
            </Text>
            
            <Text style={[styles.artistInfo, { color: secondaryTextColor }]}>
              {artistTracks.length} {artistTracks.length === 1 ? 'chanson' : 'chansons'} • {albumsMap.size} {albumsMap.size === 1 ? 'album' : 'albums'}
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: COLORS.primary }]}
                onPress={() => artistTracks.length > 0 && handleTrackPress(artistTracks[0])}
              >
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.playButtonText}>Lire</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.shuffleButton}
                onPress={handleShufflePlay}
              >
                <Ionicons name="shuffle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        renderItem={({ item: [albumName, albumTracks] }) => (
          <View style={styles.albumSection}>
            <Text style={[styles.albumTitle, { color: textColor }]}>
              {albumName}
            </Text>
            
            {albumTracks.map(track => (
              <TrackItem
                key={track.id}
                track={track}
                onPress={handleTrackPress}
                isPlaying={currentTrack?.id === track.id}
                showArtwork
                showDuration
                showAlbum={false}
              />
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
      
      {/* Mini Player */}
      {currentTrack && (
        <MiniPlayer onPress={() => router.push(`/track-details?trackId=${currentTrack.id}`)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    marginTop: SPACING.medium,
  },
  artistHeader: {
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.large,
    paddingBottom: SPACING.xl,
  },
  artistImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: SPACING.large,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  artistImage: {
    width: '100%',
    height: '100%',
  },
  artistImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  artistName: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  artistInfo: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    marginBottom: SPACING.large,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: LAYOUT.borderRadius.medium,
    marginRight: SPACING.medium,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  playButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
    marginLeft: SPACING.small,
  },
  shuffleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  albumSection: {
    marginBottom: SPACING.large,
    paddingHorizontal: SPACING.large,
  },
  albumTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.medium,
    marginTop: SPACING.large,
  },
  listContent: {
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight + 10,
  },
}); 