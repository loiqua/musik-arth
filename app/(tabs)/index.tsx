import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FullPlayer from '../../components/FullPlayer';
import MiniPlayer from '../../components/MiniPlayer';
import TrackItem from '../../components/TrackItem';
import { COLORS, FONTS, LAYOUT, SPACING } from '../../constants/Theme';
import { Track, useMusicStore } from '../../store/musicStore';
import { formatTitle, getPlaceholderArtwork, getAlbumPlaceholderArtwork, getArtistPlaceholderArtwork } from '../../utils/audioUtils';
import { useColorScheme } from '../../hooks/useColorScheme';
import AppHeader from '../../components/AppHeader';

const { width } = Dimensions.get('window');
const ALBUM_SIZE = (width - SPACING.large * 2 - SPACING.medium * 2) / 2;

interface ArtistData {
  name: string;
  albums: {
    name: string;
    artwork: string | null;
    tracks: Track[];
  }[];
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  
  const {
    tracks,
    currentTrack,
    hasPermission,
    isLoading,
    requestPermissions,
    loadTracks,
    playTrack,
  } = useMusicStore();
  
  // Request permissions and load tracks when the screen is focused
  useEffect(() => {
    if (!hasPermission) {
      requestPermissions();
    } else if (tracks.length === 0) {
      loadTracks();
    }
  }, [hasPermission, tracks.length]);
  
  // Generate recently played tracks (for demo purposes)
  useEffect(() => {
    if (tracks.length > 0) {
      // Randomly select 5 tracks for recently played
      const shuffled = [...tracks].sort(() => 0.5 - Math.random());
      setRecentlyPlayed(shuffled.slice(0, 5));
    }
  }, [tracks]);
  
  // Organize tracks by artist and album
  const artistsData = useMemo(() => {
    const artistMap = new Map<string, ArtistData>();
    
    tracks.forEach(track => {
      const artistName = track.artist || 'Unknown Artist';
      const albumName = track.album || 'Unknown Album';
      
      if (!artistMap.has(artistName)) {
        artistMap.set(artistName, {
          name: artistName,
          albums: []
        });
      }
      
      const artist = artistMap.get(artistName)!;
      let album = artist.albums.find(a => a.name === albumName);
      
      if (!album) {
        album = {
          name: albumName,
          artwork: track.artwork,
          tracks: []
        };
        artist.albums.push(album);
      }
      
      album.tracks.push(track);
    });
    
    // Convert map to array and sort by artist name
    return Array.from(artistMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [tracks]);
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };
  
  const renderAlbumItem = ({ item }: { item: { name: string, artwork: string | null, tracks: Track[] } }) => {
    // Utiliser l'artwork du premier morceau ou générer un placeholder
    const firstTrack = item.tracks[0];
    const artworkSource = firstTrack.artwork 
      ? { uri: firstTrack.artwork } 
      : { uri: getAlbumPlaceholderArtwork(item.name, firstTrack.artist) };
    
    const handleAlbumPress = () => {
      router.push(`/album-details?albumName=${encodeURIComponent(item.name)}`);
    };
    
    return (
      <TouchableOpacity
        style={styles.albumItem}
        onPress={handleAlbumPress}
        activeOpacity={0.7}
      >
        <View style={styles.albumArtContainer}>
          <Image source={artworkSource} style={styles.albumArt} />
          <View style={styles.albumArtOverlay} />
          <View style={styles.albumPlayButton}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </View>
        </View>
        <Text style={[styles.albumTitle, { color: textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.albumArtist, { color: secondaryTextColor }]} numberOfLines={1}>
          {firstTrack.artist}
        </Text>
        <Text style={[styles.albumTrackCount, { color: secondaryTextColor }]}>
          {item.tracks.length} {item.tracks.length === 1 ? 'song' : 'songs'}
        </Text>
      </TouchableOpacity>
    );
  };
  
  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AppHeader title="musik'arth" />
        <View style={styles.permissionContainer}>
          <Ionicons
            name="lock-closed"
            size={60}
            color={secondaryTextColor}
            style={styles.permissionIcon}
          />
          <Text style={[styles.permissionTitle, { color: textColor }]}>
            Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: secondaryTextColor }]}>
            We need access to your media library to display your music
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: COLORS.primary }]}
            onPress={requestPermissions}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader 
        title="Listen Now" 
        rightComponent={
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recently Played Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Recently Played
          </Text>
          
          {recentlyPlayed.length > 0 ? (
            <FlatList
              data={recentlyPlayed}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const artworkSource = item.artwork 
                  ? { uri: item.artwork } 
                  : { uri: getPlaceholderArtwork(item.title, item.artist) };
                
                return (
                  <TouchableOpacity
                    style={styles.albumItem}
                    onPress={() => handleTrackPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.albumArtContainer}>
                      <Image source={artworkSource} style={styles.albumArt} />
                      <View style={styles.albumArtOverlay} />
                      <View style={styles.playIconContainer}>
                        <Ionicons name="play" size={24} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text 
                      style={[styles.albumTitle, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {formatTitle(item.title, 20)}
                    </Text>
                    <Text 
                      style={[styles.albumArtist, { color: secondaryTextColor }]}
                      numberOfLines={1}
                    >
                      {item.artist}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.albumList}
            />
          ) : (
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              No recently played tracks
            </Text>
          )}
        </View>
        
        {/* Artists Section */}
        {artistsData.map((artist) => (
          <View key={artist.name} style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {artist.name}
              </Text>
              
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push(`/artist-details?artistName=${encodeURIComponent(artist.name)}`)}
              >
                <Text style={[styles.seeAllText, { color: COLORS.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            
            {artist.albums.length > 0 && (
              <FlatList
                data={artist.albums}
                keyExtractor={(item) => `${artist.name}-${item.name}`}
                renderItem={renderAlbumItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.albumList}
              />
            )}
            
            {/* Show some tracks from this artist */}
            <View style={styles.tracksContainer}>
              {artist.albums.flatMap(album => album.tracks).slice(0, 3).map((track) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  onPress={handleTrackPress}
                  isPlaying={currentTrack?.id === track.id}
                  showArtwork
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* Mini Player */}
      {currentTrack && (
        <MiniPlayer onPress={() => router.push(`/track-details?trackId=${currentTrack.id}`)} />
      )}
      
      {/* Full Screen Player */}
      {isPlayerVisible && (
        <FullPlayer onClose={() => setIsPlayerVisible(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight + 10,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.medium,
    paddingHorizontal: SPACING.large,
  },
  albumList: {
    paddingHorizontal: SPACING.large,
    paddingBottom: SPACING.small,
  },
  albumItem: {
    width: ALBUM_SIZE,
    marginRight: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  albumArtContainer: {
    width: ALBUM_SIZE,
    height: ALBUM_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.small,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  albumArt: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  albumArtOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 16,
  },
  albumPlayButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  albumTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginBottom: 2,
  },
  albumArtist: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  albumTrackCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
    opacity: 0.8,
  },
  tracksContainer: {
    marginTop: SPACING.medium,
    paddingHorizontal: SPACING.large,
    paddingBottom: SPACING.small,
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
  },
  seeAllText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  permissionIcon: {
    marginBottom: SPACING.large,
  },
  permissionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    marginBottom: SPACING.medium,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  permissionButton: {
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: LAYOUT.borderRadius.medium,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  permissionButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
    marginBottom: SPACING.medium,
  },
  playIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 45, 85, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.95,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
