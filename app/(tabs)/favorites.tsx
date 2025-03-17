import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { useColorScheme } from '../../hooks/useColorScheme';
import { COLORS, FONTS, LAYOUT, SPACING } from '../../constants/Theme';
import TrackItem from '../../components/TrackItem';
import { Track, useMusicStore } from '../../store/musicStore';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AppHeader from '../../components/AppHeader';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const tracks = useMusicStore(state => state.tracks);
  const playTrack = useMusicStore(state => state.playTrack);
  const currentTrack = useMusicStore(state => state.currentTrack);
  const getFavoriteTracks = useMusicStore(state => state.getFavoriteTracks);
  const toggleFavorite = useMusicStore(state => state.toggleFavorite);
  
  const [favoriteTracks, setFavoriteTracks] = useState(getFavoriteTracks());
  
  // Update favorites when tracks change
  useEffect(() => {
    setFavoriteTracks(getFavoriteTracks());
  }, [tracks]);
  
  const handlePlayTrack = (track: Track) => {
    playTrack(track);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleRemoveFromFavorites = (trackId: string) => {
    toggleFavorite(trackId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader title="Favorites" />
      
      {favoriteTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart" size={64} color={COLORS.primary} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            No favorite tracks yet
          </Text>
          <Text style={[styles.emptySubtext, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
            Tap the heart icon on any track to add it to your favorites
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteTracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={() => handlePlayTrack(item)}
              isPlaying={currentTrack?.id === item.id}
              showArtwork
              showDuration
              showOptions
              onOptionsPress={() => handleRemoveFromFavorites(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
  },
  emptyIcon: {
    marginBottom: SPACING.medium,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.medium,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 