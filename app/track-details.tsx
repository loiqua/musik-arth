import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Track, useMusicStore } from '../store/musicStore';
import { formatTime, formatTitle, getPlaceholderArtwork, getColorFromString } from '../utils/audioUtils';
import { useColorScheme } from '../hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import SimpleSlider from '../components/SimpleSlider';
import AppHeader from '../components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function TrackDetailsScreen() {
  const router = useRouter();
  const { trackId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  
  const {
    tracks,
    playlists,
    currentTrack,
    playTrack,
    pauseTrack,
    deleteTrack,
    toggleFavorite,
    isPlaying,
    playbackPosition,
    playbackDuration,
    seekTo,
    playNextTrack,
    playPreviousTrack,
  } = useMusicStore();
  
  // Trouver la piste correspondante
  const track = tracks.find(t => t.id === trackId) as Track;
  
  // Si la piste n'existe pas, retourner à l'écran précédent
  if (!track) {
    router.back();
    return null;
  }
  
  // Mettre à jour la valeur du slider en fonction de la position de lecture
  useEffect(() => {
    if (!isSeeking && playbackDuration > 0 && currentTrack?.id === track.id) {
      setSliderValue(playbackPosition / playbackDuration);
    }
  }, [playbackPosition, playbackDuration, isSeeking, currentTrack, track.id]);
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  
  // Nettoyer le titre pour l'affichage
  const cleanTitle = formatTitle(track.title);
  
  // Générer une couleur de fond basée sur le titre et l'artiste pour l'artwork par défaut
  const placeholderColor = getColorFromString(`${track.title}${track.artist}`);
  
  // Determine artwork source
  const artworkSource = track?.artwork 
    ? { uri: track.artwork } 
    : { uri: getPlaceholderArtwork(track?.title || 'Unknown', track?.artist || 'Unknown') };
  
  // Trouver les playlists qui contiennent cette piste
  const trackPlaylists = playlists.filter(playlist => 
    playlist.tracks.includes(track.id)
  );
  
  const handlePlayPause = () => {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(track);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleToggleFavorite = () => {
    toggleFavorite(track.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleDelete = () => {
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
          onPress: async () => {
            await deleteTrack(track.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleOptionsPress = () => {
    // Afficher les options pour la piste
    handleDelete();
  };
  
  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
  }, []);
  
  const handleSeekComplete = useCallback((value: number) => {
    if (playbackDuration > 0 && currentTrack?.id === track.id) {
      seekTo(value * playbackDuration);
    }
    // Utiliser requestAnimationFrame pour améliorer les performances
    requestAnimationFrame(() => {
      setIsSeeking(false);
    });
  }, [playbackDuration, seekTo, currentTrack, track.id]);
  
  const handleNext = useCallback(() => {
    playNextTrack();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playNextTrack]);
  
  const handlePrevious = useCallback(() => {
    playPreviousTrack();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playPreviousTrack]);
  
  // Déterminer si la piste actuelle est en cours de lecture
  const isCurrentTrack = currentTrack?.id === track.id;
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader 
        title="Track Details" 
        leftComponent={
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleOptionsPress}>
            <Ionicons name="ellipsis-horizontal" size={24} color={textColor} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.contentContainer}>
        {/* Artwork */}
        <View style={styles.artworkOuterContainer}>
          <View style={styles.artworkContainer}>
            <Image 
              source={artworkSource} 
              style={styles.artwork} 
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
              style={styles.artworkOverlay}
            />
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <Ionicons name="musical-notes" size={24} color="#fff" />
              </View>
            )}
          </View>
        </View>
        
        {/* Track Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {cleanTitle}
          </Text>
          <Text style={[styles.artist, { color: secondaryTextColor }]} numberOfLines={1}>
            {track.artist !== 'Unknown Artist' ? track.artist : 'Artiste inconnu'}
          </Text>
          <Text style={[styles.album, { color: secondaryTextColor }]} numberOfLines={1}>
            {track.album !== 'Unknown Album' ? track.album : 'Album inconnu'}
          </Text>
          
          <View style={styles.durationBadge}>
            <Text style={[styles.badgeText, { color: secondaryTextColor }]}>
              {formatTime(track.duration)}
            </Text>
          </View>
        </View>
        
        {/* Timeline / Progress Bar */}
        <View style={styles.timelineContainer}>
          <SimpleSlider
            value={isCurrentTrack ? sliderValue : 0}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
            thumbTintColor={COLORS.primary}
            onSlidingStart={handleSeekStart}
            onSlidingComplete={handleSeekComplete}
          />
          
          <View style={styles.timeInfo}>
            <Text style={[styles.timeText, { color: secondaryTextColor }]}>
              {formatTime(isCurrentTrack ? playbackPosition : 0)}
            </Text>
            <Text style={[styles.timeText, { color: secondaryTextColor }]}>
              {formatTime(track.duration)}
            </Text>
          </View>
        </View>
        
        {/* Player Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handlePrevious}
          >
            <Ionicons 
              name="play-skip-back" 
              size={32} 
              color={textColor} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={handlePlayPause}
          >
            <Ionicons 
              name={isCurrentTrack && isPlaying ? "pause" : "play"} 
              size={36} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleNext}
          >
            <Ionicons 
              name="play-skip-forward" 
              size={32} 
              color={textColor} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Bottom Actions */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={track.isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={track.isFavorite ? COLORS.primary : textColor}
          />
          <Text style={[styles.favoriteText, { color: textColor }]}>
            {track.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.large,
    paddingBottom: SPACING.large,
    justifyContent: 'space-between',
  },
  artworkOuterContainer: {
    alignItems: 'center',
    marginTop: SPACING.medium,
  },
  artworkContainer: {
    width: width * 0.75,  // Réduire légèrement la largeur pour un meilleur aspect
    aspectRatio: 1, // Assurer un format carré pour un meilleur cadrage
    borderRadius: 24, // Réduire légèrement le rayon pour plus d'élégance
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#333', // Ajouter une couleur de fond pour éviter les transparences
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,  // Ajouter une fine bordure
    borderColor: 'rgba(255,255,255,0.1)', // Bordure subtile
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    marginTop: SPACING.medium,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    textAlign: 'center',
    marginBottom: 4,
  },
  artist: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
    marginBottom: 2,
  },
  album: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    textAlign: 'center',
    marginBottom: 4,
  },
  durationBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.small,
  },
  timelineContainer: {
    marginTop: SPACING.medium,
    paddingHorizontal: SPACING.small,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.medium,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.medium,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: LAYOUT.borderRadius.medium,
    marginTop: SPACING.medium,
  },
  favoriteText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginLeft: 8,
  },
});