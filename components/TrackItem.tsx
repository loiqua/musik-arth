import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal,
  Alert,
  FlatList,
  Share
} from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Track, useMusicStore } from '../store/musicStore';
import { formatTime, formatTitle, getPlaceholderArtwork } from '../utils/audioUtils';
import * as Haptics from 'expo-haptics';

interface TrackItemProps {
  track: Track;
  onPress: (track: Track) => void;
  isPlaying?: boolean;
  showArtwork?: boolean;
  showAlbum?: boolean;
  showDuration?: boolean;
  showOptions?: boolean;
  onOptionsPress?: (track: Track) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({
  track,
  onPress,
  isPlaying = false,
  showArtwork = true,
  showAlbum = true,
  showDuration = true,
  showOptions = true,
  onOptionsPress,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  
  const deleteTrack = useMusicStore(state => state.deleteTrack);
  const playlists = useMusicStore(state => state.playlists);
  const addTrackToPlaylist = useMusicStore(state => state.addTrackToPlaylist);
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const menuBackgroundColor = isDark ? COLORS.cardDark : COLORS.card;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  
  const artworkSource = track.artwork 
    ? { uri: track.artwork } 
    : { uri: getPlaceholderArtwork(track.title, track.artist) };
  
  const handleLongPress = () => {
    router.push(`/track-details?trackId=${track.id}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleOptionsPress = () => {
    if (onOptionsPress) {
      onOptionsPress(track);
    } else {
      setIsMenuVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handleViewDetails = () => {
    setIsMenuVisible(false);
    router.push(`/track-details?trackId=${track.id}`);
  };
  
  const handleDeleteTrack = () => {
    setIsMenuVisible(false);
    
    Alert.alert(
      'Supprimer la piste',
      'Êtes-vous sûr de vouloir supprimer cette piste ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteTrack(track.id)
              .then(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              })
              .catch(error => {
                console.error('Erreur lors de la suppression de la piste:', error);
                Alert.alert('Erreur', 'Impossible de supprimer cette piste.');
              });
          },
        },
      ]
    );
  };
  
  const handleAddToPlaylist = () => {
    setIsMenuVisible(false);
    setIsPlaylistModalVisible(true);
  };
  
  const handleSelectPlaylist = (playlistId: string) => {
    addTrackToPlaylist(playlistId, track.id);
    setIsPlaylistModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Afficher une confirmation
    Alert.alert(
      'Piste ajoutée',
      'La piste a été ajoutée à la playlist avec succès.',
      [{ text: 'OK' }]
    );
  };
  
  const handleCreatePlaylist = () => {
    setIsPlaylistModalVisible(false);
    
    // Naviguer vers la page de création de playlist
    router.push('/create-playlist');
  };
  
  const handleShareTrack = async () => {
    setIsMenuVisible(false);
    
    try {
      const result = await Share.share({
        title: track.title,
        message: `Écoute "${track.title}" par ${track.artist} sur Musik-Arth!`,
      });
      
      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager cette piste.');
    }
  };
  
  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress(track)}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {showArtwork && (
          <Image
            source={artworkSource}
            style={styles.artwork}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.infoContainer}>
          <Text 
            style={[
              styles.title, 
              { color: isPlaying ? COLORS.primary : textColor }
            ]}
            numberOfLines={1}
          >
            {formatTitle(track.title)}
            {track.isLocal && (
              <Text style={{ color: COLORS.primary }}> • Local</Text>
            )}
          </Text>
          
          <Text 
            style={[styles.artist, { color: secondaryTextColor }]}
            numberOfLines={1}
          >
            {track.artist}
            {showAlbum && track.album !== 'Unknown Album' && ` • ${track.album}`}
          </Text>
        </View>
        
        <View style={styles.rightContainer}>
          {showDuration && (
            <Text style={[styles.duration, { color: secondaryTextColor }]}>
              {formatTime(track.duration)}
            </Text>
          )}
          
          {showOptions && (
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
          )}
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
              onPress={handleViewDetails}
            >
              <Ionicons name="information-circle-outline" size={24} color={textColor} />
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Voir les détails
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleAddToPlaylist}
            >
              <Ionicons name="add-circle-outline" size={24} color={textColor} />
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Ajouter à une playlist
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleShareTrack}
            >
              <Ionicons name="share-outline" size={24} color={textColor} />
              <Text style={[styles.menuItemText, { color: textColor }]}>
                Partager
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={handleDeleteTrack}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.menuItemText, { color: "#FF3B30" }]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Modal de sélection de playlist */}
      <Modal
        visible={isPlaylistModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPlaylistModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.playlistModalContainer, 
              { backgroundColor: backgroundColor }
            ]}
          >
            <View style={styles.playlistModalHeader}>
              <Text style={[styles.playlistModalTitle, { color: textColor }]}>
                Ajouter à une playlist
              </Text>
              <TouchableOpacity
                onPress={() => setIsPlaylistModalVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            {playlists.length > 0 ? (
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.playlistItem}
                    onPress={() => handleSelectPlaylist(item.id)}
                  >
                    <View style={styles.playlistIconContainer}>
                      <Ionicons name="musical-notes" size={24} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.playlistName, { color: textColor }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.playlistCount, { color: secondaryTextColor }]}>
                      {item.tracks.length} pistes
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.playlistList}
              />
            ) : (
              <View style={styles.emptyPlaylistContainer}>
                <Ionicons name="musical-notes" size={48} color={secondaryTextColor} />
                <Text style={[styles.emptyPlaylistText, { color: secondaryTextColor }]}>
                  Aucune playlist disponible
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.createPlaylistButton, { backgroundColor: COLORS.primary }]}
              onPress={handleCreatePlaylist}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.createPlaylistText}>
                Créer une nouvelle playlist
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
  artwork: {
    width: LAYOUT.albumArt.small,
    height: LAYOUT.albumArt.small,
    borderRadius: LAYOUT.borderRadius.small,
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.medium,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginBottom: 4,
  },
  artist: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    marginRight: SPACING.small,
  },
  optionsButton: {
    padding: SPACING.xs,
  },
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
  
  // Styles pour le modal de playlist
  playlistModalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: LAYOUT.borderRadius.medium,
    overflow: 'hidden',
  },
  playlistModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  playlistModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
  },
  playlistList: {
    paddingVertical: SPACING.small,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  playlistIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.medium,
  },
  playlistName: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
  },
  playlistCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  emptyPlaylistContainer: {
    padding: SPACING.large * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlaylistText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginTop: SPACING.medium,
    textAlign: 'center',
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.medium,
    margin: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
  },
  createPlaylistText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: 'white',
    marginLeft: SPACING.small,
  },
});

export default TrackItem;