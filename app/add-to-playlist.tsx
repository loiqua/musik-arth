import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Playlist, Track, useMusicStore } from '../store/musicStore';
import AppHeader from '../components/AppHeader';
import * as Haptics from 'expo-haptics';

export default function AddToPlaylistScreen() {
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const {
    tracks,
    playlists: storePlaylists,
    addTrackToPlaylist,
    createPlaylist,
  } = useMusicStore();
  
  useEffect(() => {
    setPlaylists(storePlaylists);
  }, [storePlaylists]);
  
  // Trouver la piste concernée
  const track = tracks.find(t => t.id === trackId);
  
  if (!track) {
    Alert.alert('Erreur', 'Piste non trouvée');
    router.back();
    return null;
  }
  
  const handleAddToPlaylist = (playlistId: string) => {
    addTrackToPlaylist(playlistId, trackId as string);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      'Ajouté à la playlist',
      'La piste a été ajoutée à la playlist avec succès.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };
  
  const handleCreatePlaylist = () => {
    router.push('/create-playlist');
  };

  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader
        title="Ajouter à une playlist"
        showBackButton
        onBackPress={() => router.back()}
      />
      
      <View style={styles.trackInfoContainer}>
        <Text style={[styles.infoLabel, { color: textColor }]}>
          Ajouter la piste :
        </Text>
        <Text style={[styles.trackTitle, { color: textColor }]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={[styles.trackArtist, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.createPlaylistButton, 
          { backgroundColor: COLORS.primary }
        ]}
        onPress={handleCreatePlaylist}
      >
        <Ionicons name="add-circle" size={24} color="#FFFFFF" />
        <Text style={styles.createPlaylistText}>
          Créer une nouvelle playlist
        </Text>
      </TouchableOpacity>
      
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Mes playlists
      </Text>
      
      {playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={64} color={COLORS.primary} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            Aucune playlist
          </Text>
          <Text style={[styles.emptySubtext, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
            Créez une playlist pour y ajouter des chansons
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.playlistItem,
                { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }
              ]}
              onPress={() => handleAddToPlaylist(item.id)}
            >
              <View style={styles.playlistIconContainer}>
                <Ionicons name="list" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.playlistInfo}>
                <Text style={[styles.playlistName, { color: textColor }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.playlistCount, { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary }]}>
                  {item.tracks.length} {item.tracks.length === 1 ? 'piste' : 'pistes'}
                </Text>
              </View>
            </TouchableOpacity>
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
  trackInfoContainer: {
    padding: SPACING.large,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    marginBottom: SPACING.small,
  },
  trackTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.xs,
  },
  trackArtist: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.large,
    marginVertical: SPACING.large,
    paddingVertical: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  createPlaylistText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
    marginLeft: SPACING.small,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    marginHorizontal: SPACING.large,
    marginBottom: SPACING.medium,
  },
  listContent: {
    paddingHorizontal: SPACING.large,
    paddingBottom: SPACING.xl,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    marginBottom: SPACING.medium,
  },
  playlistIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.medium,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginBottom: 4,
  },
  playlistCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
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
}); 