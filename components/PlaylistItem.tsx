import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal, 
  Alert,
  TextInput,
  Image
} from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Playlist, useMusicStore, Track } from '../store/musicStore';
import { getColorFromString, getPlaceholderArtwork } from '../utils/audioUtils';
import * as Haptics from 'expo-haptics';

interface PlaylistItemProps {
  playlist: Playlist;
  trackCount?: number;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  playlist,
  trackCount,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState(playlist.name);
  
  const renamePlaylist = useMusicStore(state => state.renamePlaylist);
  const deletePlaylist = useMusicStore(state => state.deletePlaylist);
  const tracks = useMusicStore(state => state.tracks);
  const playTrack = useMusicStore(state => state.playTrack);
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const menuBackgroundColor = isDark ? COLORS.cardDark : COLORS.card;
  const inputBackgroundColor = isDark ? COLORS.cardDark : COLORS.card;
  
  // Generate a color based on the playlist name
  const color = getColorFromString(playlist.name);
  
  // Optimiser le calcul du nombre de pistes uniques avec useMemo
  const uniqueTrackCount = useMemo(() => {
    if (trackCount !== undefined) return trackCount;
    return new Set(playlist.tracks).size;
  }, [playlist.tracks, trackCount]);
  
  // Get the tracks in this playlist
  const playlistTracks = React.useMemo(() => {
    return playlist.tracks
      .map(id => tracks.find(track => track.id === id))
      .filter(track => track !== undefined) as Track[];
  }, [playlist, tracks]);
  
  // Get artwork for the playlist
  const playlistArtwork = React.useMemo(() => {
    if (playlistTracks.length > 0 && playlistTracks[0].artwork) {
      return playlistTracks[0].artwork;
    }
    return getPlaceholderArtwork(playlist.name, 'Playlist');
  }, [playlist, playlistTracks]);
  
  const handlePress = () => {
    router.push(`/playlist-details?playlistId=${playlist.id}`);
  };
  
  const handleOptionsPress = () => {
    setIsMenuVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleRename = () => {
    setIsMenuVisible(false);
    setIsRenameModalVisible(true);
  };
  
  const handleDelete = () => {
    setIsMenuVisible(false);
    
    Alert.alert(
      'Supprimer la playlist',
      `Êtes-vous sûr de vouloir supprimer "${playlist.name}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deletePlaylist(playlist.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };
  
  const handleSaveRename = () => {
    if (newPlaylistName.trim() !== '') {
      renamePlaylist(playlist.id, newPlaylistName.trim());
      setIsRenameModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  
  const handlePlaylist = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0]);
    }
  };
  
  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: playlistArtwork }}
          style={styles.artwork}
        />
        
        <View style={styles.info}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={[styles.trackCount, { color: secondaryTextColor }]}>
            {playlistTracks.length} {playlistTracks.length === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        
        <View style={styles.actions}>
          {playlistTracks.length > 0 && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlaylist}
              activeOpacity={0.7}
            >
              <Ionicons name="play" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-forward" size={22} color={secondaryTextColor} />
        </View>
      </TouchableOpacity>
      
      {/* Menu d'options */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View 
            style={[
              styles.menuContainer, 
              { backgroundColor: menuBackgroundColor }
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleRename}
            >
              <Ionicons name="create-outline" size={24} color={textColor} />
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Renommer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.menuItemText, { color: "#FF3B30" }]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Modal de renommage */}
      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.renameModalContainer, 
              { backgroundColor: menuBackgroundColor }
            ]}
          >
            <View style={styles.renameModalHeader}>
              <Text style={[styles.renameModalTitle, { color: textColor }]}>
                Renommer la playlist
              </Text>
              <TouchableOpacity
                onPress={() => setIsRenameModalVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.renameInput,
                { 
                  color: textColor,
                  backgroundColor: inputBackgroundColor,
                  borderColor: newPlaylistName ? COLORS.primary : 'transparent'
                }
              ]}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
              maxLength={50}
            />
            
            <TouchableOpacity
              style={[
                styles.saveButton,
                { 
                  backgroundColor: newPlaylistName.trim() ? COLORS.primary : 'rgba(0, 122, 255, 0.5)',
                  opacity: newPlaylistName.trim() ? 1 : 0.7
                }
              ]}
              onPress={handleSaveRename}
              disabled={!newPlaylistName.trim()}
            >
              <Text style={styles.saveButtonText}>
                Enregistrer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.small,
    padding: SPACING.medium,
    borderRadius: 12,
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: SPACING.medium,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.medium,
    marginBottom: 2,
  },
  trackCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.small,
  },
  
  // Styles pour le menu d'options
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    borderRadius: LAYOUT.borderRadius.medium,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginLeft: SPACING.medium,
  },
  
  // Styles pour le modal de renommage
  renameModalContainer: {
    width: '90%',
    borderRadius: LAYOUT.borderRadius.medium,
    overflow: 'hidden',
    padding: SPACING.medium,
  },
  renameModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  renameModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
  },
  renameInput: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.large,
    padding: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    marginBottom: SPACING.large,
    borderWidth: 2,
  },
  saveButton: {
    padding: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: 'white',
  },
});

export default PlaylistItem; 