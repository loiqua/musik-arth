import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal, 
  Alert,
  TextInput
} from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Playlist, useMusicStore } from '../store/musicStore';
import { getColorFromString } from '../utils/audioUtils';
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
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const menuBackgroundColor = isDark ? COLORS.cardDark : COLORS.card;
  const inputBackgroundColor = isDark ? COLORS.cardDark : COLORS.card;
  
  // Generate a color based on the playlist name
  const color = getColorFromString(playlist.name);
  
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
  
  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.artworkContainer}>
          <View
            style={[styles.artwork, { backgroundColor: color }]}
          >
            <Ionicons name="musical-notes" size={32} color="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <Text 
            style={[styles.name, { color: textColor }]}
            numberOfLines={1}
          >
            {playlist.name}
          </Text>
          
          <Text 
            style={[styles.trackCount, { color: secondaryTextColor }]}
            numberOfLines={1}
          >
            {trackCount || playlist.tracks.length} {(trackCount || playlist.tracks.length) === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={handleOptionsPress}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons 
            name="ellipsis-horizontal" 
            size={20} 
            color={secondaryTextColor} 
          />
        </TouchableOpacity>
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
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.medium,
  },
  artworkContainer: {
    width: LAYOUT.albumArt.small,
    height: LAYOUT.albumArt.small,
    borderRadius: LAYOUT.borderRadius.small,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.medium,
    justifyContent: 'center',
  },
  name: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginBottom: 4,
  },
  trackCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  optionsButton: {
    padding: SPACING.xs,
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