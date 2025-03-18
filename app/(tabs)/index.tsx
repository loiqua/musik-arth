import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
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
import { useColorScheme } from '../../hooks/useColorScheme';
import AppHeader from '../../components/AppHeader';

export default function SongsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
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
  useEffect(() => {
    if (!hasPermission) {
      requestPermissions();
    } else if (tracks.length === 0) {
      loadTracks();
    }
  }, [hasPermission, tracks.length]);
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };
  
  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AppHeader title="Songs" />
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
  
  if (tracks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AppHeader title="Songs" />
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={80} color={secondaryTextColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            Your Library is Empty
          </Text>
          <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
            Add music to your library to start listening
          </Text>
        </View>
        {currentTrack && <MiniPlayer onPress={() => setIsPlayerVisible(true)} />}
        {isPlayerVisible && <FullPlayer onClose={() => setIsPlayerVisible(false)} />}
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader 
        title="Songs" 
        rightComponent={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/library')}
          >
            <Ionicons name="add" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackItem
            track={item}
            onPress={() => handleTrackPress(item)}
            isPlaying={currentTrack?.id === item.id}
            showArtwork
            showAlbum
            showDuration
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      
      {currentTrack && <MiniPlayer onPress={() => setIsPlayerVisible(true)} />}
      {isPlayerVisible && <FullPlayer onClose={() => setIsPlayerVisible(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight + 10,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
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
    borderRadius: 12,
  },
  permissionButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    marginVertical: SPACING.medium,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
});
