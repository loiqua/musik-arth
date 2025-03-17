import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FullPlayer from '../../components/FullPlayer';
import MiniPlayer from '../../components/MiniPlayer';
import TrackItem from '../../components/TrackItem';
import { COLORS, FONTS, LAYOUT, SPACING } from '../../constants/Theme';
import { Track, useMusicStore } from '../../store/musicStore';
import { useColorScheme } from '../../hooks/useColorScheme';
import AppHeader from '../../components/AppHeader';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  
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
  useFocusEffect(
    React.useCallback(() => {
      if (!hasPermission) {
        requestPermissions();
      } else if (tracks.length === 0) {
        loadTracks();
      }
    }, [hasPermission, tracks.length])
  );
  
  // Filter tracks based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = tracks.filter(
      track =>
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query)
    );
    
    setSearchResults(filtered);
  }, [searchQuery, tracks]);
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const inputBackgroundColor = isDark ? COLORS.cardDark : COLORS.card;
  
  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AppHeader title="Search" />
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
            We need access to your media library to search your music
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
      <AppHeader title="Search" />
      
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: inputBackgroundColor }]}>
          <Ionicons name="search" size={20} color={secondaryTextColor} style={styles.searchIcon} />
          
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search by song, artist, or album"
            placeholderTextColor={secondaryTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={secondaryTextColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Loading your music...
          </Text>
        </View>
      ) : (
        <>
          {searchQuery.trim() === '' ? (
            <View style={styles.emptySearchContainer}>
              <Ionicons
                name="search"
                size={80}
                color={secondaryTextColor}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                Search Your Library
              </Text>
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
                Find songs, artists, and albums in your music collection
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={[styles.noResultsText, { color: secondaryTextColor }]}>
                No results found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TrackItem
                  track={item}
                  onPress={handleTrackPress}
                  isPlaying={currentTrack?.id === item.id}
                />
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}
      
      {/* Mini Player */}
      {currentTrack && (
        <MiniPlayer onPress={() => setIsPlayerVisible(true)} />
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
  searchContainer: {
    paddingHorizontal: SPACING.large,
    marginBottom: SPACING.large,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.medium,
    paddingHorizontal: SPACING.medium,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.small,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    height: '100%',
  },
  clearButton: {
    padding: SPACING.small,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight,
  },
  emptySearchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    marginBottom: SPACING.large,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    marginBottom: SPACING.medium,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
  },
  noResultsContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
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