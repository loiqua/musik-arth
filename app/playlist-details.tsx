import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Playlist, Track, useMusicStore } from '../store/musicStore';
import { useColorScheme } from '../hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import AppHeader from '../components/AppHeader';
import TrackItem from '../components/TrackItem';

export default function PlaylistDetailsScreen() {
  const router = useRouter();
  const { playlistId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [isAddTrackModalVisible, setIsAddTrackModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const {
    playlists,
    tracks,
    currentTrack,
    playTrack,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
    renamePlaylist,
  } = useMusicStore();
  
  // Trouver la playlist correspondante
  const playlist = playlists.find(p => p.id === playlistId) as Playlist;
  
  // Si la playlist n'existe pas, retourner à l'écran précédent
  if (!playlist) {
    router.back();
    return null;
  }
  
  // Obtenir les pistes de la playlist
  const playlistTracks = tracks.filter(track => 
    playlist.tracks.includes(track.id)
  );
  
  // Obtenir les pistes qui ne sont pas dans la playlist
  const tracksNotInPlaylist = tracks.filter(track => 
    !playlist.tracks.includes(track.id)
  );
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  const handlePlayTrack = (track: Track) => {
    playTrack(track);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleRemoveTrack = (trackId: string) => {
    Alert.alert(
      'Retirer de la playlist',
      'Voulez-vous retirer cette piste de la playlist ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            removeTrackFromPlaylist(playlist.id, trackId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };
  
  const handleAddTrack = (trackId: string) => {
    addTrackToPlaylist(playlist.id, trackId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAddTrackModalVisible(false);
  };
  
  const handleDeletePlaylist = () => {
    Alert.alert(
      'Supprimer la playlist',
      'Êtes-vous sûr de vouloir supprimer cette playlist ?',
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
            router.back();
          },
        },
      ]
    );
  };
  
  const handleRenamePlaylist = () => {
    if (newPlaylistName.trim()) {
      renamePlaylist(playlist.id, newPlaylistName.trim());
      setIsRenameModalVisible(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const openRenameModal = () => {
    setNewPlaylistName(playlist.name);
    setIsRenameModalVisible(true);
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader 
        title={playlist.name}
        showBackButton={true}
        onBackPress={() => router.back()}
        rightComponent={
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={openRenameModal}
            >
              <Ionicons name="pencil" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDeletePlaylist}
            >
              <Ionicons name="trash-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        }
      />
      
      <View style={styles.infoContainer}>
        <Text style={[styles.playlistName, { color: textColor }]}>
          {playlist.name}
        </Text>
        <Text style={[styles.trackCount, { color: secondaryTextColor }]}>
          {playlistTracks.length} {playlistTracks.length === 1 ? 'piste' : 'pistes'}
        </Text>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={() => setIsAddTrackModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ajouter des pistes</Text>
        </TouchableOpacity>
      </View>
      
      {playlistTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={64} color={secondaryTextColor} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            Cette playlist est vide
          </Text>
          <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
            Ajoutez des pistes en appuyant sur le bouton ci-dessus
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlistTracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={() => handlePlayTrack(item)}
              isPlaying={currentTrack?.id === item.id}
              showArtwork
              showDuration
              showOptions
              onOptionsPress={() => handleRemoveTrack(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {/* Modal pour ajouter des pistes */}
      <Modal
        visible={isAddTrackModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddTrackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Ajouter des pistes
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddTrackModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            {tracksNotInPlaylist.length === 0 ? (
              <View style={styles.emptyModalContainer}>
                <Text style={[styles.emptyModalText, { color: secondaryTextColor }]}>
                  Toutes vos pistes sont déjà dans cette playlist
                </Text>
              </View>
            ) : (
              <FlatList
                data={tracksNotInPlaylist}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TrackItem
                    track={item}
                    onPress={() => handleAddTrack(item.id)}
                    showArtwork
                    showDuration
                    showOptions={false}
                  />
                )}
                contentContainerStyle={styles.modalListContent}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Modal pour renommer la playlist */}
      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.renameModalContainer, { backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Renommer la playlist
            </Text>
            
            <TextInput
              style={[styles.input, { color: textColor, borderColor: isDark ? COLORS.borderDark : COLORS.border }]}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Nom de la playlist"
              placeholderTextColor={secondaryTextColor}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsRenameModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { opacity: newPlaylistName.trim() ? 1 : 0.5 }]}
                onPress={handleRenamePlaylist}
                disabled={!newPlaylistName.trim()}
              >
                <Text style={styles.modalButtonText}>Renommer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: SPACING.small,
    marginLeft: SPACING.small,
  },
  infoContainer: {
    padding: SPACING.large,
    alignItems: 'center',
  },
  playlistName: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  trackCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    marginBottom: SPACING.medium,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: LAYOUT.borderRadius.medium,
  },
  addButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
    marginLeft: SPACING.small,
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
    fontSize: FONTS.sizes.xl,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '70%',
    borderRadius: LAYOUT.borderRadius.medium,
    overflow: 'hidden',
  },
  renameModalContainer: {
    width: '90%',
    padding: SPACING.large,
    borderRadius: LAYOUT.borderRadius.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
  },
  modalListContent: {
    paddingBottom: SPACING.large,
  },
  emptyModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.large,
  },
  emptyModalText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.small,
    padding: SPACING.medium,
    marginTop: SPACING.large,
    marginBottom: SPACING.large,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    alignItems: 'center',
    marginHorizontal: SPACING.small,
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
  },
}); 