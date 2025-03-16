import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import AddOnlineTrackModal from '../../components/AddOnlineTrackModal';
import CreatePlaylistModal from '../../components/CreatePlaylistModal';
import FullPlayer from '../../components/FullPlayer';
import MiniPlayer from '../../components/MiniPlayer';
import PlaylistItem from '../../components/PlaylistItem';
import TrackItem from '../../components/TrackItem';
import { COLORS, FONTS, LAYOUT, SPACING } from '../../constants/Theme';
import { Playlist, Track, useMusicStore } from '../../store/musicStore';

export default function LibraryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isCreatePlaylistVisible, setIsCreatePlaylistVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<'playlists' | 'songs'>('playlists');
  const [isAddOnlineTrackVisible, setIsAddOnlineTrackVisible] = useState(false);
  
  const {
    tracks,
    playlists,
    isLoading,
    hasPermission,
    currentTrack,
    requestPermissions,
    loadTracks,
    playTrack,
    importAudioFile,
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
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  const handleTrackPress = (track: Track) => {
    playTrack(track);
  };
  
  const handlePlaylistPress = (playlist: Playlist) => {
    // Navigate to playlist detail screen
    console.log('Navigate to playlist:', playlist.name);
  };
  
  const renderEmptyLibrary = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="musical-notes"
        size={80}
        color={secondaryTextColor}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        Your Library is Empty
      </Text>
      <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
        Add music files to your device to start listening
      </Text>
    </View>
  );
  
  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Library</Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={importAudioFile}
          >
            <Ionicons name="cloud-upload" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsCreatePlaylistVisible(true)}
          >
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsAddOnlineTrackVisible(true)}
          >
            <Ionicons name="globe-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Section Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeSection === 'playlists' && styles.activeTab,
          ]}
          onPress={() => setActiveSection('playlists')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeSection === 'playlists' ? COLORS.primary : secondaryTextColor },
            ]}
          >
            Playlists
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeSection === 'songs' && styles.activeTab,
          ]}
          onPress={() => setActiveSection('songs')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeSection === 'songs' ? COLORS.primary : secondaryTextColor },
            ]}
          >
            Songs
          </Text>
        </TouchableOpacity>
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
          {activeSection === 'playlists' ? (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PlaylistItem
                  playlist={item}
                  onPress={handlePlaylistPress}
                />
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyListContainer}>
                  <Text style={[styles.emptyListText, { color: secondaryTextColor }]}>
                    No playlists yet. Create one to get started!
                  </Text>
                </View>
              )}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <FlatList
              data={tracks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TrackItem
                  track={item}
                  onPress={handleTrackPress}
                  isPlaying={currentTrack?.id === item.id}
                />
              )}
              ListEmptyComponent={renderEmptyLibrary}
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
      
      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        visible={isCreatePlaylistVisible}
        onClose={() => setIsCreatePlaylistVisible(false)}
      />
      
      <AddOnlineTrackModal
        visible={isAddOnlineTrackVisible}
        onClose={() => setIsAddOnlineTrackVisible(false)}
      />
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
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.large,
    paddingBottom: SPACING.medium,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xxxl,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.small,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.large,
    marginBottom: SPACING.medium,
  },
  tab: {
    marginRight: SPACING.large,
    paddingVertical: SPACING.small,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight,
  },
  emptyContainer: {
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
  emptyListContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyListText: {
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