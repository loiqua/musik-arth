import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SectionList,
  Image
} from 'react-native';
import AddOnlineTrackModal from '../../components/AddOnlineTrackModal';
import CreatePlaylistModal from '../../components/CreatePlaylistModal';
import FullPlayer from '../../components/FullPlayer';
import MiniPlayer from '../../components/MiniPlayer';
import PlaylistItem from '../../components/PlaylistItem';
import TrackItem from '../../components/TrackItem';
import { COLORS, FONTS, LAYOUT, SPACING } from '../../constants/Theme';
import { Playlist, Track, useMusicStore } from '../../store/musicStore';
import { useColorScheme } from '../../hooks/useColorScheme';
import AppHeader from '../../components/AppHeader';
import { useRouter } from 'expo-router';
import { getAlbumPlaceholderArtwork, getArtistPlaceholderArtwork, getPlaceholderArtwork } from '../../utils/audioUtils';

interface SectionData {
  title: string;
  data: Track[];
  artwork?: string | null;
}

export default function LibraryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isCreatePlaylistVisible, setIsCreatePlaylistVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<'playlists' | 'songs' | 'artists' | 'albums'>('playlists');
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
    importAudioFile
  } = useMusicStore();
  
  const router = useRouter();
  
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
  
  // Organize tracks by artist
  const artistSections = useMemo(() => {
    const artistMap = new Map<string, { tracks: Track[], artwork: string | null }>();
    
    // Pour chaque artiste, on ne garde que les informations sur l'artiste
    // et ses albums, mais pas les titres individuels qui seront dans la section Songs
    tracks.forEach(track => {
      const artistName = track.artist || 'Unknown Artist';
      
      if (!artistMap.has(artistName)) {
        artistMap.set(artistName, { 
          tracks: [],
          artwork: track.artwork || getArtistPlaceholderArtwork(artistName)
        });
      }
      
      // On n'ajoute PAS la piste directement ici
      // Pour éviter la duplication, on compte juste le nombre de pistes
      const artistData = artistMap.get(artistName)!;
      if (!artistData.tracks.some(t => t.id === track.id)) {
        artistData.tracks.push(track);
      }
    });
    
    // Convert map to array and sort by artist name
    return Array.from(artistMap.entries())
      .map(([title, { tracks, artwork }]) => ({ 
        title, 
        data: [], // On n'affiche pas les pistes ici
        trackCount: tracks.length,
        artwork 
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [tracks]);
  
  // Organize tracks by album
  const albumSections = useMemo(() => {
    const albumMap = new Map<string, { tracks: Track[], artwork: string | null }>();
    
    tracks.forEach(track => {
      const albumName = track.album || 'Unknown Album';
      
      if (!albumMap.has(albumName)) {
        albumMap.set(albumName, { 
          tracks: [],
          artwork: track.artwork || getAlbumPlaceholderArtwork(albumName, track.artist)
        });
      }
      
      albumMap.get(albumName)!.tracks.push(track);
    });
    
    // Convert map to array and sort by album name
    return Array.from(albumMap.entries())
      .map(([title, { tracks, artwork }]) => ({ 
        title, 
        data: [], // On n'affiche pas les pistes individuelles ici
        trackCount: tracks.length,
        artwork 
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [tracks]);
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  const handleTrackPress = (track: Track) => {
    playTrack(track);
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
  
  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    // Déterminer la source de l'artwork en fonction du type de section
    let artworkSource;
    
    if (activeSection === 'artists') {
      artworkSource = { uri: getArtistPlaceholderArtwork(section.title) };
    } else if (activeSection === 'albums') {
      artworkSource = section.artwork 
        ? { uri: section.artwork } 
        : { uri: getAlbumPlaceholderArtwork(section.title) };
    } else {
      // Pour les playlists ou autres sections
      artworkSource = section.artwork 
        ? { uri: section.artwork } 
        : { uri: getPlaceholderArtwork(section.title, 'Various Artists') };
    }
    
    const handleSectionPress = () => {
      if (activeSection === 'artists') {
        router.push(`/artist-details?artistName=${section.title}`);
      } else if (activeSection === 'albums') {
        router.push(`/album-details?albumName=${section.title}`);
      }
    };
    
    return (
      <TouchableOpacity 
        style={[styles.sectionHeader, { backgroundColor }]}
        onPress={handleSectionPress}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderImageContainer}>
          <Image source={artworkSource} style={styles.sectionHeaderImage} />
          <View style={styles.sectionHeaderImageOverlay} />
        </View>
        <View style={styles.sectionHeaderTextContainer}>
          <Text style={[styles.sectionHeaderText, { color: textColor }]}>
            {section.title}
          </Text>
          <Text style={[styles.sectionHeaderCount, { color: secondaryTextColor }]}>
            {section.data.length} {section.data.length === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={secondaryTextColor} />
      </TouchableOpacity>
    );
  };
  
  const renderArtistItem = ({ item }: { item: any }) => {
    const artistName = item.title;
    const artistArtwork = item.artwork || getArtistPlaceholderArtwork(artistName);
    
    return (
      <TouchableOpacity 
        style={[
          styles.artistItem, 
          { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }
        ]}
        onPress={() => router.push(`/artist-details?name=${encodeURIComponent(artistName)}`)}
      >
        <Image 
          source={{ uri: artistArtwork }} 
          style={styles.artistImage}
        />
        <View style={styles.artistInfo}>
          <Text style={[styles.artistName, { color: textColor }]}>
            {artistName}
          </Text>
          <Text style={[styles.artistStat, { color: secondaryTextColor }]}>
            {item.trackCount} {item.trackCount === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={secondaryTextColor} />
      </TouchableOpacity>
    );
  };
  
  const renderAlbumItem = ({ item }: { item: any }) => {
    const albumName = item.title;
    const albumArtwork = item.artwork || getAlbumPlaceholderArtwork(albumName);
    
    return (
      <TouchableOpacity 
        style={[
          styles.albumItem, 
          { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }
        ]}
        onPress={() => router.push(`/album-details?name=${encodeURIComponent(albumName)}`)}
      >
        <Image 
          source={{ uri: albumArtwork }} 
          style={styles.albumImage}
        />
        <View style={styles.albumInfo}>
          <Text style={[styles.albumName, { color: textColor }]}>
            {albumName}
          </Text>
          <Text style={[styles.albumStat, { color: secondaryTextColor }]}>
            {item.trackCount} {item.trackCount === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={secondaryTextColor} />
      </TouchableOpacity>
    );
  };
  
  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AppHeader title="Library" />
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
        title="Library" 
        rightComponent={
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
        }
      />
      
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
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeSection === 'artists' && styles.activeTab,
          ]}
          onPress={() => setActiveSection('artists')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeSection === 'artists' ? COLORS.primary : secondaryTextColor },
            ]}
          >
            Artists
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeSection === 'albums' && styles.activeTab,
          ]}
          onPress={() => setActiveSection('albums')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeSection === 'albums' ? COLORS.primary : secondaryTextColor },
            ]}
          >
            Albums
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
          ) : activeSection === 'songs' ? (
            <FlatList
              data={tracks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TrackItem
                  track={item}
                  onPress={handleTrackPress}
                  isPlaying={currentTrack?.id === item.id}
                  showArtwork
                  showAlbum
                  showDuration
                />
              )}
              ListEmptyComponent={renderEmptyLibrary}
              contentContainerStyle={styles.listContent}
            />
          ) : activeSection === 'artists' ? (
            <SectionList
              sections={artistSections}
              keyExtractor={(item) => item.id}
              renderItem={renderArtistItem}
              renderSectionHeader={renderSectionHeader}
              ListEmptyComponent={renderEmptyLibrary}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled
            />
          ) : (
            <SectionList
              sections={albumSections}
              keyExtractor={(item) => item.id}
              renderItem={renderAlbumItem}
              renderSectionHeader={renderSectionHeader}
              ListEmptyComponent={renderEmptyLibrary}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled
            />
          )}
        </>
      )}
      
      {/* Mini Player */}
      {currentTrack && (
        <MiniPlayer onPress={() => router.push(`/track-details?trackId=${currentTrack.id}`)} />
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
    paddingBottom: 2,
  },
  tab: {
    marginRight: SPACING.large,
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.small,
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
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight + 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
    justifyContent: 'space-between',
  },
  sectionHeaderImageContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: SPACING.medium,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sectionHeaderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  sectionHeaderImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
  },
  sectionHeaderTextContainer: {
    flex: 1,
  },
  sectionHeaderText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.medium,
  },
  sectionHeaderCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    marginTop: 2,
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    marginBottom: SPACING.large,
    opacity: 0.8,
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
    opacity: 0.8,
  },
  emptyListContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  emptyListText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    marginTop: SPACING.medium,
    opacity: 0.8,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  permissionIcon: {
    marginBottom: SPACING.large,
    opacity: 0.8,
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
    opacity: 0.8,
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
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  artistImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.medium,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.medium,
  },
  artistStat: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    marginTop: 2,
    opacity: 0.8,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  albumImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.medium,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.medium,
  },
  albumStat: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    marginTop: 2,
    opacity: 0.8,
  },
}); 