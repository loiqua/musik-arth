import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import MiniPlayer from '../components/MiniPlayer';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Playlist, useMusicStore } from '../store/musicStore';
import { getAlbumPlaceholderArtwork } from '../utils/audioUtils';
import CreateAlbumModal from '../components/CreateAlbumModal';

// Définir le type Album puisqu'il n'est pas exporté par le store
interface Album {
  id: string;
  title: string;
  artist: string;
  artwork: string | null;
  tracks: string[];
}

export default function AlbumsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [isCreateAlbumVisible, setIsCreateAlbumVisible] = useState(false);
  
  // Obtenir les albums depuis le store
  const { currentTrack, isLoading } = useMusicStore();
  
  // Comme 'albums' n'existe pas dans le store, nous utiliserons un tableau vide pour le moment
  // Cela doit être ajouté au store plus tard
  const albums: Album[] = [];
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  // Fonction pour compter le nombre de pistes dans un album
  const getTrackCount = (albumId: string) => {
    const album = albums.find((a: Album) => a.id === albumId);
    if (!album) return 0;
    return album.tracks.length;
  };
  
  // Fonction pour obtenir l'artwork d'un album
  const getAlbumArtwork = (album: Album) => {
    return album.artwork ?? getAlbumPlaceholderArtwork(album.title, album.artist);
  };
  
  // Fonction pour naviguer vers les détails d'un album
  const handleAlbumPress = (albumId: string) => {
    router.push(`/album-details?albumId=${albumId}`);
  };
  
  // Rendu d'un élément d'album
  const renderAlbumItem = ({ item }: { item: Album }) => {
    const trackCount = getTrackCount(item.id);
    
    return (
      <TouchableOpacity
        style={styles.albumItem}
        onPress={() => handleAlbumPress(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.albumImageContainer}>
          <Image 
            source={{ uri: getAlbumArtwork(item) }} 
            style={styles.albumImage} 
          />
          <View style={styles.albumImageOverlay} />
          <View style={styles.albumIconContainer}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </View>
        </View>
        
        <Text
          style={[styles.albumTitle, { color: textColor }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        
        <Text
          style={[styles.albumArtist, { color: secondaryTextColor }]}
          numberOfLines={1}
        >
          {item.artist}
        </Text>
        
        <Text
          style={[styles.albumTrackCount, { color: secondaryTextColor }]}
        >
          {trackCount} {trackCount === 1 ? 'chanson' : 'chansons'}
        </Text>
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <AppHeader title="Albums" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Chargement...
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader 
        title="Albums" 
        rightComponent={
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsCreateAlbumVisible(true)}
          >
            <Ionicons name="add" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {albums.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="disc" 
              size={80} 
              color={secondaryTextColor} 
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              Pas d'albums
            </Text>
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              Créez votre premier album pour organiser vos morceaux
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: COLORS.primary }]}
              onPress={() => setIsCreateAlbumVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Créer un album</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={albums}
            keyExtractor={(item) => item.id}
            renderItem={renderAlbumItem}
            numColumns={2}
            contentContainerStyle={styles.albumsGrid}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
      
      {/* Mini Player */}
      {currentTrack && (
        <MiniPlayer onPress={() => router.push('/track-details')} />
      )}
      
      {/* Modal pour créer un album */}
      <CreateAlbumModal
        visible={isCreateAlbumVisible}
        onClose={() => setIsCreateAlbumVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: LAYOUT.miniPlayerHeight + LAYOUT.tabBarHeight + 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    marginTop: SPACING.medium,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    paddingTop: SPACING.xxl * 2,
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
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: LAYOUT.borderRadius.medium,
    elevation: 2,
  },
  emptyButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
  },
  albumsGrid: {
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.large,
  },
  albumItem: {
    width: '48%',
    marginBottom: SPACING.large,
    marginHorizontal: '1%',
  },
  albumImageContainer: {
    aspectRatio: 1,
    borderRadius: LAYOUT.borderRadius.medium,
    overflow: 'hidden',
    marginBottom: SPACING.small,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  albumImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  albumImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  albumIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginBottom: 2,
  },
  albumArtist: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    marginBottom: 2,
  },
  albumTrackCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.xs,
  },
}); 