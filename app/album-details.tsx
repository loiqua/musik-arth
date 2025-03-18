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
import { getAlbumPlaceholderArtwork } from '../utils/audioUtils';

export default function AlbumDetailsScreen() {
  const { albumName: encodedAlbumName } = useLocalSearchParams<{ albumName: string }>();
  const albumName = useMemo(() => {
    return encodedAlbumName ? decodeURIComponent(encodedAlbumName as string) : '';
  }, [encodedAlbumName]);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { tracks, currentTrack, playTrack, isLoading } = useMusicStore();
  
  // Débogage
  console.log('albumName (décodé):', albumName);
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  // Filtrer les pistes par album
  const albumTracks = useMemo(() => {
    const filteredTracks = tracks.filter(track => track.album === albumName);
    console.log(`Tracks filtrées pour l'album "${albumName}":`, filteredTracks.length);
    return filteredTracks;
  }, [tracks, albumName]);
  
  // Obtenir l'artiste de l'album (utiliser le premier morceau)
  const albumArtist = useMemo(() => {
    if (albumTracks.length === 0) return 'Artiste inconnu';
    
    // Vérifier si tous les morceaux sont du même artiste
    const artists = new Set(albumTracks.map(track => track.artist));
    if (artists.size === 1) {
      return albumTracks[0].artist;
    }
    
    return 'Artistes variés';
  }, [albumTracks]);
  
  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };
  
  // Trouver une image d'album (utiliser la première piste avec artwork)
  const albumImage = useMemo(() => {
    const trackWithArtwork = albumTracks.find(track => track.artwork);
    return trackWithArtwork?.artwork || getAlbumPlaceholderArtwork(albumName as string, albumArtist);
  }, [albumTracks, albumName, albumArtist]);
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AppHeader title="Album" showBackButton />
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
        title="Album" 
        showBackButton 
        rightComponent={
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={albumTracks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.albumHeader}>
            <View style={styles.albumImageContainer}>
              <Image 
                source={{ uri: albumImage }} 
                style={styles.albumImage} 
                resizeMode="cover"
              />
              <View style={styles.albumImageOverlay} />
            </View>
            
            <Text style={[styles.albumName, { color: textColor }]}>
              {albumName}
            </Text>
            
            <Text style={[styles.albumArtist, { color: secondaryTextColor }]}>
              {albumArtist}
            </Text>
            
            <Text style={[styles.albumInfo, { color: secondaryTextColor }]}>
              {albumTracks.length} {albumTracks.length === 1 ? 'chanson' : 'chansons'}
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: COLORS.primary }]}
                onPress={() => albumTracks.length > 0 && handleTrackPress(albumTracks[0])}
              >
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.playButtonText}>Lire</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shuffleButton}>
                <Ionicons name="shuffle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        renderItem={({ item, index }) => (
          <TrackItem
            track={item}
            onPress={handleTrackPress}
            isPlaying={currentTrack?.id === item.id}
            showArtwork
            showDuration
            showAlbum={false}
          />
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
  albumHeader: {
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.large,
    paddingBottom: SPACING.xl,
  },
  albumImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.large,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  albumName: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  albumArtist: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  albumInfo: {
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
  listContent: {
    paddingHorizontal: SPACING.large,
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight + 10,
  },
}); 