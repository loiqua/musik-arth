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
  
  // Préparer la source de l'image
  const artworkSource = track.artwork && !imageError
    ? { uri: track.artwork } 
    : { uri: getPlaceholderArtwork(track.title, track.artist) };
  
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
  
  // Styles dynamiques qui dépendent de isDark
  const favoriteButtonStyle = {
    ...styles.favoriteButton,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  };
  
  // Déterminer si la piste actuelle est en cours de lecture
  const isCurrentTrack = currentTrack?.id === track.id;
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header avec effet de flou */}
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={textColor} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          Détails de la piste
        </Text>
        
        <TouchableOpacity style={styles.optionsButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </BlurView>
      
      <View style={styles.content}>
        {/* Artwork */}
        <View 
          style={[
            styles.artworkContainer, 
            { backgroundColor: placeholderColor }
          ]}
        >
          {imageLoading && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
          
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
          
          {!track.artwork || imageError ? (
            <View style={styles.placeholderTextContainer}>
              <Ionicons name="musical-note" size={80} color="white" />
            </View>
          ) : null}
        </View>
        
        {/* Track Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {cleanTitle}
          </Text>
          <Text style={[styles.artist, { color: secondaryTextColor }]}>
            {track.artist !== 'Unknown Artist' ? track.artist : 'Artiste inconnu'}
          </Text>
          <Text style={[styles.album, { color: secondaryTextColor }]}>
            {track.album !== 'Unknown Album' ? track.album : 'Album inconnu'}
          </Text>
          <Text style={[styles.duration, { color: secondaryTextColor }]}>
            Durée: {formatTime(track.duration)}
          </Text>
          
          {track.isLocal && (
            <View style={styles.badgeContainer}>
              <Text style={[styles.localBadge, { color: COLORS.primary }]}>
                Fichier local
              </Text>
            </View>
          )}
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
            style={styles.slider}
          />
          
          <View style={styles.timeTextContainer}>
            <Text style={[styles.timeText, { color: secondaryTextColor }]}>
              {isCurrentTrack ? formatTime(playbackPosition) : '00:00'}
            </Text>
            <Text style={[styles.timeText, { color: secondaryTextColor }]}>
              {formatTime(track.duration)}
            </Text>
          </View>
        </View>
        
        {/* Playback Controls */}
        <View style={styles.playbackControlsContainer}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handlePrevious}
          >
            <Ionicons 
              name="play-skip-back" 
              size={28} 
              color={textColor} 
            />
          </TouchableOpacity>
          
          {/* Play Button */}
          <TouchableOpacity 
            style={[styles.playButton, { backgroundColor: COLORS.primary }]}
            onPress={handlePlayPause}
          >
            <Ionicons 
              name={(isCurrentTrack && isPlaying) ? "pause" : "play"} 
              size={28} 
              color="#FFFFFF" 
            />
            <Text style={styles.playButtonText}>
              {(isCurrentTrack && isPlaying) ? "Pause" : "Lire"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleNext}
          >
            <Ionicons 
              name="play-skip-forward" 
              size={28} 
              color={textColor} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Favorite Button */}
          <TouchableOpacity 
            style={favoriteButtonStyle}
            onPress={handleToggleFavorite}
          >
            <Ionicons 
              name={track.isFavorite ? "heart" : "heart-outline"} 
              size={28} 
              color={track.isFavorite ? COLORS.primary : textColor} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Playlists */}
        {trackPlaylists.length > 0 && (
          <View style={styles.playlistsSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Dans les playlists
            </Text>
            
            {trackPlaylists.map(playlist => (
              <View key={playlist.id} style={[styles.playlistItem, { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }]}>
                <Ionicons name="list" size={20} color={secondaryTextColor} />
                <Text style={[styles.playlistName, { color: textColor }]}>
                  {playlist.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
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
    paddingHorizontal: SPACING.medium,
    paddingTop: SPACING.large + 10,
    paddingBottom: SPACING.medium,
    zIndex: 10,
  },
  backButton: {
    padding: SPACING.small,
    marginLeft: -SPACING.small,
  },
  headerTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    flex: 1,
    textAlign: 'center',
  },
  optionsButton: {
    padding: SPACING.small,
    marginRight: -SPACING.small,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.large,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: LAYOUT.miniPlayerHeight + SPACING.medium,
  },
  artworkContainer: {
    width: width - SPACING.large * 2,
    height: width * 0.6,
    borderRadius: 16,
    marginTop: SPACING.medium,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  placeholderTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    width: '100%',
    marginTop: SPACING.large,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  artist: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  album: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  duration: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    textAlign: 'center',
    marginBottom: SPACING.medium,
  },
  badgeContainer: {
    marginTop: SPACING.small,
  },
  localBadge: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.small,
    textAlign: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.small,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  timelineContainer: {
    width: '100%',
    marginTop: SPACING.large,
    marginBottom: SPACING.medium,
  },
  slider: {
    height: 40,
    width: '100%',
  },
  timeTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.small,
    marginTop: -SPACING.small,
  },
  timeText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  playbackControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.medium,
  },
  controlButton: {
    padding: SPACING.medium,
    marginHorizontal: SPACING.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.small,
  },
  favoriteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.medium,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: 30,
    minWidth: 150,
  },
  playButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
    marginLeft: SPACING.small,
  },
  playlistsSection: {
    width: '100%',
    marginTop: SPACING.large,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.medium,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    marginBottom: SPACING.small,
  },
  playlistName: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginLeft: SPACING.small,
  },
});