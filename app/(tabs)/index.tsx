import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { formatTitle, getPlaceholderArtwork } from '../../utils/audioUtils';
import { useColorScheme } from '../../hooks/useColorScheme';
import AppHeader from '../../components/AppHeader';

const { width } = Dimensions.get('window');
const ALBUM_SIZE = (width - SPACING.large * 2 - SPACING.medium * 2) / 2;

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
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };
  
  // Group tracks by first letter of artist name (for demo purposes)
  const getRandomCategories = () => {
    if (tracks.length === 0) return [];
    
    const categories = [
      { title: 'Recently Added', data: tracks.slice(0, 10) },
      { title: 'Made For You', data: tracks.slice(10, 20) },
    ];
    
    return categories;
  };
  
  const renderAlbumItem = ({ item }: { item: Track }) => {
    const artworkSource = item.artwork 
      ? { uri: item.artwork } 
      : { uri: getPlaceholderArtwork(item.title, item.artist) };
    
    return (
      <TouchableOpacity
        style={styles.albumItem}
        onPress={() => handleTrackPress(item)}
        activeOpacity={0.7}
      >
        <Image source={artworkSource} style={styles.albumArt} />
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
              renderItem={renderAlbumItem}
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
        
        {/* Made For You Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Made For You
          </Text>
          
          <View style={styles.madeForYouContainer}>
            <View
              style={[
                styles.madeForYouGradient,
                { backgroundColor: COLORS.primary }
              ]}
            >
              <Ionicons name="musical-notes" size={32} color="#FFFFFF" />
              <Text style={styles.madeForYouTitle}>
                Your Favorites Mix
              </Text>
              <Text style={styles.madeForYouSubtitle}>
                Based on your listening history
              </Text>
            </View>
          </View>
        </View>
        
        {/* Top Tracks Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Top Tracks
          </Text>
          
          {tracks.slice(0, 5).map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              onPress={handleTrackPress}
              isPlaying={currentTrack?.id === track.id}
            />
          ))}
          
          {tracks.length > 5 && (
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: COLORS.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight,
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
  },
  albumItem: {
    width: ALBUM_SIZE,
    marginRight: SPACING.medium,
  },
  albumArt: {
    width: ALBUM_SIZE,
    height: ALBUM_SIZE,
    borderRadius: LAYOUT.borderRadius.medium,
    marginBottom: SPACING.small,
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
  madeForYouContainer: {
    paddingHorizontal: SPACING.large,
  },
  madeForYouGradient: {
    borderRadius: LAYOUT.borderRadius.medium,
    padding: SPACING.large,
    height: 160,
    justifyContent: 'center',
  },
  madeForYouTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    color: '#FFFFFF',
    marginTop: SPACING.medium,
    marginBottom: SPACING.small,
  },
  madeForYouSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: SPACING.medium,
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
  },
  permissionButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
  },
});
